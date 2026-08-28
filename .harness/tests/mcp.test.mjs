import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import readline from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";

const serverPath = fileURLToPath(new URL("../mcp/skill-router.mjs", import.meta.url));

test("MCP server initializes, lists tools, and routes a task", async (t) => {
  const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
  t.after(() => child.kill());
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const pending = new Map();
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    const resolve = pending.get(message.id);
    if (resolve) {
      pending.delete(message.id);
      resolve(message);
    }
  });

  let id = 0;
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 3000);
    pending.set(requestId, (message) => {
      clearTimeout(timer);
      resolve(message);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params })}\n`);
  });

  const initialized = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  assert.equal(initialized.result.serverInfo.name, "peaktalk-skill-router");

  const listed = await request("tools/list");
  assert.ok(listed.result.tools.some((tool) => tool.name === "route_task"));
  assert.ok(listed.result.tools.some((tool) => tool.name === "complete_task"));

  const routed = await request("tools/call", { name: "route_task", arguments: { task: "Review React workspace UI" } });
  assert.equal(routed.result.isError, false);
  assert.equal(routed.result.structuredContent.classification.mode, "review");
});
