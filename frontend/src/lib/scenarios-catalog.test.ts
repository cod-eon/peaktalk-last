import assert from 'node:assert/strict';
import {
  FALLBACK_SCENARIO_SLUGS,
  getFallbackScenarioBySlug,
  getFallbackScenarios,
} from './scenarios-catalog.js';

const wedgeSlug = 'roadmap-budget-defense';
const scenario = getFallbackScenarioBySlug(wedgeSlug);

assert.ok(FALLBACK_SCENARIO_SLUGS.includes(wedgeSlug));
assert.ok(scenario, 'roadmap/budget defense fallback scenario must exist');

if (scenario) {
  assert.equal(scenario.category, 'roadmap');
  assert.match(scenario.title, /Roadmap|бюджет/i);
  assert.match(scenario.subtitle, /CEO|CFO|founder|board|руковод/i);
  assert.match(scenario.persona, /CEO|CFO|founder|board/i);
  assert.match(`${scenario.situation}\n${scenario.problem}\n${scenario.pressure}`, /Head of Product|Product Lead|CPO/i);
  assert.match((scenario.expectedOutput ?? []).join('\n'), /Defense Brief/);
  assert.ok((scenario.sampleQuestions ?? []).length >= 4);
  assert.ok((scenario.whatToPrepare ?? []).length >= 3);
  assert.ok((scenario.faq ?? []).length >= 2);
}

assert.ok(getFallbackScenarios('roadmap').some((item) => item.slug === wedgeSlug));
