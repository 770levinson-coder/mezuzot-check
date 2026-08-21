// SMS via SMS4Free API
async function sendSms(phone, message) {
  const user     = process.env.SMS4FREE_USER;
  const pass     = process.env.SMS4FREE_PASS;
  const sender   = process.env.SMS4FREE_SENDER || "05XXXXXXXX";

  if (!user || !pass) {
    console.warn("[sms] SMS4FREE credentials not set â skipping");
    return;
  }

  const body = JSON.stringify({
    Key:      process.env.SMS4FREE_KEY || "",
    User:     user,
    Password: pass,
    Sender:   sender,
    Recipients: [{ Phone: phone }],
    Msg:      message,
  });

  try {
    const fetch = (await import("node-fetch")).default;
    const res   = await fetch("https://api.sms4free.co.il/ApiSMS/v2/SendSMS", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const json = await res.json();
    console.log("[sms] status:", json.status, "| to:", phone);
  } catch (e) {
    console.error("[sms] error:", e.message);
  }
}

module.exports = { sendSms };
