import { createServer } from "node:http";

if (process.env.NODE_ENV === "production") throw new Error("Mail capture is development/test only");
const host = process.env.AUTH_MAIL_CAPTURE_HOST ?? "127.0.0.1";
const port = Number(process.env.AUTH_MAIL_CAPTURE_PORT ?? "8025");
const messages = [];
const send = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};
createServer((req, res) => {
  if (req.method === "POST" && req.url === "/messages") {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", chunk => { raw += chunk; if (raw.length > 131072) req.destroy(); });
    req.on("end", () => {
      try {
        const message = JSON.parse(raw);
        if (!message.to || !message.url) return send(res, 400, { error: "invalid message" });
        messages.push({ ...message, capturedAt: new Date().toISOString() });
        send(res, 202, { accepted: true });
      } catch { send(res, 400, { error: "invalid JSON" }); }
    });
    return;
  }
  if (req.method === "GET" && req.url === "/messages") return send(res, 200, messages);
  send(res, 404, { error: "not found" });
}).listen(port, host, () => console.log(`Development auth mail capture listening on http://${host}:${port}`));
