import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, root), "utf8").toLowerCase();
}

test("durable product docs keep the MVP interaction contract aligned", () => {
  const product = read("docs/product/product-model.md");
  const boundaries = read("docs/product/mvp-boundaries.md");
  const flow = read("docs/specs/core-flow.md");
  const decision = read("docs/decisions/0004-text-simulation-optional-voice-input.md");

  for (const document of [product, boundaries, flow]) {
    assert.match(document, /text[- ]based adversarial simulation|text simulation/);
    assert.match(document, /optional voice input/);
  }
  assert.match(boundaries, /voice simulation/);
  assert.match(decision, /does not include voice simulation/);
  assert.match(flow, /typed input must always work/);
});

test("durable architecture docs keep Storage and Auth as separate gated migrations", () => {
  const architecture = read("docs/architecture/current-system.md");
  const storage = read("docs/decisions/0002-storage-yandex-object-storage.md");
  const auth = read("docs/decisions/0003-auth-logto-migration-gate.md");

  assert.match(architecture, /storage and auth migrations are separate/);
  assert.match(storage, /does not authorize migration/);
  assert.match(auth, /does not authorize deployment or code changes/);
});
