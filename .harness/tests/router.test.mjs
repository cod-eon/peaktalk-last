import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRouter } from "../lib/router.mjs";

const router = createRouter();

test("product decisions stop at an approval gate", () => {
  const route = router.routeTask({ task: "Choose a new paywall and onboarding flow for PeakTalk" });
  assert.equal(route.classification.risk, "high");
  assert.equal(route.autonomy, "pause-at-decision-gate");
  assert.ok(route.decisionGates.some((gate) => gate.id === "product"));
  assert.ok(route.selectedSkills.length <= 3);
});

test("Russian product alignment language also stops at the gate", () => {
  const route = router.routeTask({ task: "Согласовать новый paywall и onboarding flow" });
  assert.equal(route.classification.mode, "plan");
  assert.equal(route.classification.risk, "high");
  assert.ok(route.decisionGates.some((gate) => gate.id === "product"));
});

test("UI implementation selects a bounded relevant stack", () => {
  const route = router.routeTask({
    task: "Implement a responsive React workspace page and verify desktop and mobile layout",
    paths: ["frontend/src/app/(dashboard)/workspace/page.tsx"]
  });
  assert.equal(route.classification.risk, "medium");
  assert.ok(route.classification.domains.includes("ui"));
  assert.ok(route.classification.domains.includes("frontend"));
  assert.ok(route.selectedSkills.length > 0 && route.selectedSkills.length <= 3);
  assert.ok(route.requiredEvidence.includes("desktop browser check"));
});

test("auth API work is high risk and requires negative security evidence", () => {
  const route = router.routeTask({ task: "Implement a FastAPI authorization endpoint for guest conversion" });
  assert.equal(route.classification.risk, "high");
  assert.ok(route.classification.domains.includes("backend"));
  assert.ok(route.requiredEvidence.includes("authentication and authorization negative cases"));
});

test("unknown and unapproved skill content cannot be loaded", () => {
  assert.throws(() => router.inspectSkill({ id: "definitely-not-a-skill", includeContent: true }), /unknown skill|catalog/);
});

test("known but unapproved catalog skill remains metadata-only", () => {
  const aasRoot = fs.mkdtempSync(path.join(os.tmpdir(), "peaktalk-aas-fixture-"));
  const dataDir = path.join(aasRoot, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "skills_index.json"), JSON.stringify([
    {
      id: "behavioral-modes",
      name: "Behavioral modes fixture",
      description: "Metadata-only router fixture",
      risk: "safe",
      path: "skills/behavioral-modes"
    }
  ]));
  const fixtureRouter = createRouter({ aasRoot });
  const metadata = fixtureRouter.inspectSkill({ id: "behavioral-modes", includeContent: false });
  assert.equal(metadata.approved, false);
  assert.throws(() => fixtureRouter.inspectSkill({ id: "behavioral-modes", includeContent: true }), /not approved/);
});

test("task contract cannot complete without every required passing check", () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "peaktalk-harness-test-"));
  const lifecycle = createRouter({ runtimeRoot });
  const contract = lifecycle.startTask({
    taskId: "review-1",
    task: "Review the code diff",
    acceptanceCriteria: ["Actionable correctness review is complete"]
  });
  assert.equal(contract.status, "ready");
  lifecycle.beginTask({ taskId: "review-1" });
  lifecycle.recordCheck({ taskId: "review-1", checkId: contract.route.requiredCheckIds[0], result: "pass", evidence: "First check evidence" });
  assert.throws(() => lifecycle.completeTask({ taskId: "review-1", summary: "Reviewed" }), /missing passing checks/);
  for (const checkId of contract.route.requiredCheckIds) {
    lifecycle.recordCheck({ taskId: "review-1", checkId, result: "pass", evidence: `Evidence for ${checkId}` });
  }
  const completed = lifecycle.completeTask({ taskId: "review-1", summary: "Reviewed against acceptance criteria" });
  assert.equal(completed.status, "complete");
});

test("code context falls back from unavailable CodeGraph CLI to rg", () => {
  const fallback = createRouter({ codegraphBin: "false", rgBin: "true" }).codeContext({ query: "routeTask", timeoutMs: 500, paths: [".harness/lib/router.mjs"] });
  assert.equal(fallback.provider, "rg");
  assert.ok(fallback.failures.some((failure) => failure.provider === "mcp"));
  assert.ok(fallback.failures.some((failure) => failure.provider === "codegraph-cli"));
});

test("ready task can explicitly enter implementation", () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "peaktalk-harness-begin-"));
  const lifecycle = createRouter({ runtimeRoot });
  lifecycle.startTask({
    taskId: "begin-1",
    task: "Review the code diff",
    acceptanceCriteria: ["Review is recorded"]
  });
  const begun = lifecycle.beginTask({ taskId: "begin-1" });
  assert.equal(begun.status, "in-progress");
});
