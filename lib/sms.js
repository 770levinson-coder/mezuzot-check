async function sendSms(phone, message) {
  const user = process.env.SMS4FREE_USER;
  const pass = process.env.SMS4FREE_PASS;
  const key  = process.env.SMS4FREE_KEY || "";
  const sender = process.env.SMS4FREE_SENDER || user;
  if (!user || !pass) {
    console.warn("[sms] SMS4FREE credentials not set - skipping");
    return;
  }
  const body = JSON.stringify({
    key,
    user,
    pass,
    sender,
    recipient: phone,
    msg: message,
  });
  try {
    const res  = await fetch("https://api.sms4free.co.il/ApiSMS/v2/SendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const json = await res.json();
    console.log("[sms] status:", json.status, "message:", json.message, "| to:", phone);
  } catch (e) {
    console.error("[sms] error:", e.message);
  }
}

module.exports = { sendSms };
