require("dotenv").config();
const express = require("express");
const path = require("path");
const { v4: uuid } = require("uuid");
const config = require("./config");
const store = require("./lib/store");
const { sendSms } = require("./lib/sms");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTime(m) {
  return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
}
function adminOk(req) {
  return req.query.key === process.env.ADMIN_KEY;
}
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return "972" + digits;
}

async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("[email] RESEND_API_KEY not set"); return; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Chabad Nof HaEmek <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    const json = await res.json();
    if (json.id) console.log("[email] sent id:", json.id);
    else console.error("[email] fail:", JSON.stringify(json));
  } catch(e) { console.error("[email] error:", e.message); }
}

app.get("/api/event", (req, res) => { res.json(config.event); });

app.get("/api/slots", async (req, res) => {
  try {
    const qty = parseInt(req.query.qty, 10);
    if (!qty || qty < 1 || qty > config.event.maxPerPerson)
      return res.status(400).json({ error: "kamut lo takana" });
    const duration = qty * config.event.minutesPerMezuza;
    const startMin = toMin(config.event.startTime);
    const endMin = toMin(config.event.endTime);
    const occupied = Object.values(await store.all()).map(a => ({
      start: toMin(a.startTime),
      end: toMin(a.startTime) + a.qty * config.event.minutesPerMezuza,
    }));
    const slots = [];
    for (let t = startMin; t + duration <= endMin; t += config.event.minutesPerMezuza) {
      const end = t + duration;
      const busy = occupied.some(o => !(end <= o.start || t >= o.end));
      if (!busy) slots.push(toTime(t));
    }
    res.json({ slots });
  } catch(e) { console.error(e); res.status(500).json({ error:"server error" }); }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, qty, startTime } = req.body;
    if (!name || !phone || !email || !qty || !startTime)
      return res.status(400).json({ error:"chasrim partim" });
    const qtyN = parseInt(qty, 10);
    if (qtyN < 1 || qtyN > config.event.maxPerPerson)
      return res.status(400).json({ error:"kamut lo takana" });
    const duration = qtyN * config.event.minutesPerMezuza;
    const tStart = toMin(startTime);
    const tEnd = tStart + duration;
    const startMin = toMin(config.event.startTime);
    const endMin = toMin(config.event.endTime);
    if (tStart < startMin || tEnd > endMin)
      return res.status(400).json({ error:"shaa lo takana" });
    const occupied = Object.values(await store.all()).map(a => ({
      start: toMin(a.startTime),
      end: toMin(a.startTime) + a.qty * config.event.minutesPerMezuza,
    }));
    const busy = occupied.some(o => !(tEnd <= o.start || tStart >= o.end));
    if (busy) return res.status(409).json({ error:"hashaa tefusa - ana bacher acheret" });
    const endTime = toTime(tEnd);
    const appt = {
      id: uuid(), name, phone, email: email||"",
      qty: qtyN, startTime, endTime,
      price: qtyN * config.event.pricePerMezuza,
      createdAt: new Date().toISOString(),
    };
    await store.add(appt);
    const normalPhone = normalizePhone(phone);
    const dayName = config.event.date.split(",")[0].trim();
    const secDate = config.event.date.split(",")[1].trim();
    const smsMsg = "שלום "+name+", רישומך לבדיקת מזוזות התקבל!\n"
      +"יום "+dayName+", "+config.event.hebrewDate+", "+secDate+"\n"
      +"שעה: "+startTime+" | "+qtyN+" מזוזות\n"
      +config.event.location+"\n"
      +"052-2577704";
    sendSms(normalPhone, smsMsg).catch(console.error);
    const td = '<td style="padding:6px;border:1px solid #ddd">';
    const emailHtml = '<div dir="rtl" style="font-family:Arial;font-size:15px">'
      +'<h2 style="color:#800020">אישור רישום לבדיקת מזוזות</h2>'
      +'<p>שלום <strong>'+name+'</strong>,</p>'
      +'<p>רישומך לבדיקת מזוזות התקבל בהצלחה!</p>'
      +'<table style="border-collapse:collapse;width:100%;max-width:420px">'
      +'<tr>'+td+'<strong>תאריך</strong></td>'+td+'יום '+dayName+', '+config.event.hebrewDate+', '+secDate+'</td></tr>'
      +'<tr>'+td+'<strong>שעה</strong></td>'+td+startTime+'</td></tr>'
      +'<tr>'+td+'<strong>כמות מזוזות</strong></td>'+td+qtyN+'</td></tr>'
      +'<tr>'+td+'<strong>מחיר</strong></td>'+td+appt.price+' ₪</td></tr>'
      +'<tr>'+td+'<strong>מיקום</strong></td>'+td+config.event.location+' (במרכז המסחרי ליד מולטי סרוויס)</td></tr>'
      +'<tr>'+td+'<strong>טלפון לפרטים</strong></td>'+td+'052-2577704</td></tr>'
      +'</table>'
      +'<p style="margin-top:16px;color:#800020"><strong>נא להגיע עם קלפי המזוזות בלבד — ללא בתי המזוזה.</strong></p>'
      +'<p>בברכה,<br>בית חב\"ד נוף העמק</p>'
      +'</div>';
    sendEmail(email, "אישור רישום לבדיקת מזוזות", emailHtml).catch(console.error);
    res.json({ ok:true, appt });
  } catch(e) { console.error(e); res.status(500).json({ error:"server error" }); }
});

app.get("/admin", (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/admin/appointments", async (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  try {
    const list = Object.values(await store.all()).sort((a,b) => toMin(a.startTime)-toMin(b.startTime));
    res.json(list);
  } catch(e) { res.status(500).json({ error:"server error" }); }
});

app.delete("/api/admin/appointment/:id", async (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  try {
    await store.remove(req.params.id);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error:"server error" }); }
});

app.patch("/api/admin/appointment/:id", async (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  try {
    const all = await store.all();
    const appt = all[req.params.id];
    if (!appt) return res.status(404).json({ error:"not found" });
    const { name, phone, email } = req.body;
    if (name) appt.name = name;
    if (phone) appt.phone = phone;
    if (email !== undefined) appt.email = email;
    await store.add(appt);
    res.json({ ok:true, appt });
  } catch(e) { res.status(500).json({ error:"server error" }); }
});

app.get("/api/admin/export", async (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  try {
    const list = Object.values(await store.all()).sort((a,b) => toMin(a.startTime)-toMin(b.startTime));
    const header = "שם,טלפון,מייל,מזוזות,שעת כניסה,שעת סיום,מחיר,נרשם ב";
    const rows = list.map(a => [a.name,a.phone,a.email,a.qty,a.startTime,a.endTime,a.price,a.createdAt].join(","));
    res.setHeader("Content-Type","text/csv; charset=utf-8");
    res.setHeader("Content-Disposition",'attachment; filename="mezuzot.csv"');
    res.send("\uFEFF"+[header,...rows].join("\n"));
  } catch(e) { res.status(500).json({ error:"server error" }); }
});

app.listen(PORT, () => console.log("Server running on port "+PORT));
