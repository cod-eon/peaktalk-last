import nodemailer from "nodemailer";

type AuthMail = { to: string; subject: string; heading: string; text: string; action: string; url: string };

export async function sendAuthMail(message: AuthMail): Promise<void> {
  const captureUrl = process.env.AUTH_MAIL_CAPTURE_URL;
  if (captureUrl) {
    if (process.env.NODE_ENV === "production") throw new Error("Auth mail capture is development/test only");
    const response = await fetch(captureUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error(`Auth mail capture failed (${response.status})`);
    return;
  }
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!from) throw new Error("EMAIL_FROM_ADDRESS is not configured");
  const html = `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,sans-serif;color:#171717"><table width="100%"><tr><td align="center" style="padding:32px 16px"><table width="560" style="max-width:100%;background:white;border:1px solid #d9d5cc"><tr><td style="padding:32px"><p style="color:#e8600a;font-weight:700;letter-spacing:.12em">PEAKTALK</p><h1>${message.heading}</h1><p style="line-height:1.6;color:#525252">${message.text}</p><p style="margin:28px 0"><a href="${message.url}" style="background:#171717;color:white;padding:14px 20px;text-decoration:none;font-weight:700">${message.action}</a></p><p style="font-size:12px;color:#737373">Если вы не запрашивали это действие, проигнорируйте письмо.</p></td></tr></table></td></tr></table></body></html>`;

  const smtpHost = process.env.AUTH_SMTP_HOST;
  const smtpUser = process.env.AUTH_SMTP_USER;
  const smtpPassword = process.env.AUTH_SMTP_PASSWORD;
  if (smtpHost || smtpUser || smtpPassword) {
    if (!smtpHost || !smtpUser || !smtpPassword) throw new Error("Auth SMTP configuration is incomplete");
    const port = Number(process.env.AUTH_SMTP_PORT ?? "465");
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("AUTH_SMTP_PORT is invalid");
    const secure = (process.env.AUTH_SMTP_SECURE ?? "true").toLowerCase() === "true";
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    await transport.sendMail({ from, to: message.to, subject: message.subject, html, text: `${message.text}\n\n${message.url}` });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Auth mail is not configured");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [message.to], subject: message.subject, html }) });
  if (!response.ok) throw new Error(`Auth mail delivery failed (${response.status})`);
}
