import assert from 'node:assert/strict';
import {
  SCENARIO_ANALYTICS_EVENTS,
  trackScenarioCatalogEvent,
  trackScenarioEvent,
  type ScenarioAnalyticsEventName,
} from './scenario-analytics.js';

const tracked: Array<{
  event: ScenarioAnalyticsEventName;
  props: Record<string, unknown>;
}> = [];

const tracker = (event: ScenarioAnalyticsEventName, props: Record<string, unknown>) => {
  tracked.push({ event, props });
};

trackScenarioEvent(
  SCENARIO_ANALYTICS_EVENTS.detailViewed,
  {
    slug: 'roadmap-budget-defense',
    title: 'Roadmap / Budget Defense',
    category: 'roadmap',
    persona: 'CEO/CFO',
    difficulty: 5,
  },
  {
    source: 'scenario_detail',
    using_fallback: true,
  },
  tracker,
);

assert.equal(tracked[0]?.event, 'scenario_detail_viewed');
assert.equal(tracked[0]?.props.scenario_slug, 'roadmap-budget-defense');
assert.equal(tracked[0]?.props.scenario_category, 'roadmap');
assert.equal(tracked[0]?.props.scenario_persona, 'CEO/CFO');
assert.equal(tracked[0]?.props.scenario_difficulty, 5);
assert.equal(tracked[0]?.props.source, 'scenario_detail');
assert.equal(tracked[0]?.props.using_fallback, true);

trackScenarioCatalogEvent(
  {
    category: 'roadmap',
    result_count: 4,
    using_fallback: false,
    featured_slug: 'roadmap-budget-defense',
  },
  tracker,
);

assert.equal(tracked[1]?.event, 'scenario_catalog_viewed');
assert.deepEqual(tracked[1]?.props, {
  category: 'roadmap',
  result_count: 4,
  using_fallback: false,
  featured_slug: 'roadmap-budget-defense',
});
