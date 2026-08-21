require("dotenv").config();
const express = require("express");
const path    = require("path");
const { v4: uuid } = require("uuid");
const config  = require("./config");
const store   = require("./lib/store");
const { sendSms } = require("./lib/sms");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function adminOk(req) {
  return req.query.key === process.env.ADMIN_KEY;
}

app.get("/api/event", (req, res) => { res.json(config.event); });

app.get("/api/slots", (req, res) => {
  const qty = parseInt(req.query.qty, 10);
  if (!qty || qty < 1 || qty > config.event.maxPerPerson)
    return res.status(400).json({ error: "kamut lo takana" });
  const duration = qty * config.event.minutesPerMezuza;
  const startMin = toMin(config.event.startTime);
  const endMin   = toMin(config.event.endTime);
  const occupied = Object.values(store.all()).map(a => ({
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
});

app.post("/api/register", async (req, res) => {
  const { name, phone, email, qty, startTime } = req.body;
  if (!name || !phone || !email || !qty || !startTime)
    return res.status(400).json({ error: "chasrim partim" });
  const qtyN = parseInt(qty, 10);
  if (qtyN < 1 || qtyN > config.event.maxPerPerson)
    return res.status(400).json({ error: "kamut lo takana" });
  const duration = qtyN * config.event.minutesPerMezuza;
  const tStart   = toMin(startTime);
  const tEnd     = tStart + duration;
  const startMin = toMin(config.event.startTime);
  const endMin   = toMin(config.event.endTime);
  if (tStart < startMin || tEnd > endMin)
    return res.status(400).json({ error: "shaa lo takana" });
  const occupied = Object.values(store.all()).map(a => ({
    start: toMin(a.startTime),
    end: toMin(a.startTime) + a.qty * config.event.minutesPerMezuza,
  }));
  const busy = occupied.some(o => !(tEnd <= o.start || tStart >= o.end));
  if (busy) return res.status(409).json({ error: "hashaa tefusa - ana bacher acheret" });
  const endTime = toTime(tEnd);
  const appt = {
    id: uuid(),
    name, phone, email: email || "",
    qty: qtyN, startTime, endTime,
    price: qtyN * config.event.pricePerMezuza,
    createdAt: new Date().toISOString(),
  };
  store.add(appt);
  const msg = [
    `Shalom ${name},`,
    `Rishumcha labdikat mezuzot hitkabel!`,
    `${config.event.date}`,
    `Shaa: ${startTime}-${endTime}`,
    `Mezuzot: ${qtyN} | Mechir: ${appt.price} NIS`,
    `${config.event.location}`,
  ].join("\n");
  sendSms(phone, msg).catch(console.error);
  res.json({ ok: true, appt });
});

app.get("/admin", (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/api/admin/appointments", (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  const list = Object.values(store.all()).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  res.json(list);
});
app.delete("/api/admin/appointment/:id", (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  store.remove(req.params.id);
  res.json({ ok: true });
});
app.get("/api/admin/export", (req, res) => {
  if (!adminOk(req)) return res.status(403).send("Forbidden");
  const list = Object.values(store.all()).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const header = "SHEM,TELEFON,MAIL,MEXUYOT,SHAA,SHAAT SIUM,MECHIR,NIRSAM B";
  const rows = list.map(a => [a.name, a.phone, a.email, a.qty, a.startTime, a.endTime, a.price, a.createdAt].join(","));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="mezuzot.csv"');
  res.send("\uFEFF" + [header, ...rows].join("\n"));
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
