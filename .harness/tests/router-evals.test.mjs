import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRouter } from "../lib/router.mjs";

const fixtures = JSON.parse(fs.readFileSync(new URL("../evals/router-fixtures.json", import.meta.url), "utf8")).fixtures;
const router = createRouter();

for (const fixture of fixtures) {
  test(`router eval: ${fixture.id}`, () => {
    const route = router.routeTask({ task: fixture.task, mode: fixture.mode, paths: fixture.paths });
    const expected = fixture.expected;
    assert.equal(route.classification.risk, expected.risk);
    if (expected.domains) {
      for (const domain of expected.domains) assert.ok(route.classification.domains.includes(domain), `${fixture.id} missing domain ${domain}`);
    }
    if (expected.gate) assert.ok(route.decisionGates.some((gate) => gate.id === expected.gate), `${fixture.id} missing gate ${expected.gate}`);
    for (const gate of expected.forbiddenGates ?? []) assert.ok(!route.decisionGates.some((item) => item.id === gate), `${fixture.id} has forbidden gate ${gate}`);
    const skillIds = route.selectedSkills.map((skill) => skill.id);
    for (const skill of expected.skills ?? []) assert.ok(skillIds.includes(skill), `${fixture.id} missing skill ${skill}`);
    for (const skill of expected.forbiddenSkills ?? []) assert.ok(!skillIds.includes(skill), `${fixture.id} selected forbidden skill ${skill}`);
    assert.ok(route.selectedSkills.length <= 3, `${fixture.id} selected more than three skills`);
  });
}
