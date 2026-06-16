import { trackEvent } from './analytics'

export const SCENARIO_ANALYTICS_EVENTS = {
  catalogViewed: 'scenario_catalog_viewed',
  cardClicked: 'scenario_card_clicked',
  primaryCtaClicked: 'scenario_primary_cta_clicked',
  detailViewed: 'scenario_detail_viewed',
  startClicked: 'scenario_start_clicked',
} as const

export type ScenarioAnalyticsEventName =
  (typeof SCENARIO_ANALYTICS_EVENTS)[keyof typeof SCENARIO_ANALYTICS_EVENTS]

type ScenarioAnalyticsValue = string | number | boolean | null | undefined
export type ScenarioAnalyticsProps = Record<string, ScenarioAnalyticsValue>

type ScenarioAnalyticsTracker = (
  event: ScenarioAnalyticsEventName,
  props: ScenarioAnalyticsProps
) => void

type ScenarioAnalyticsItem = {
  slug: string
  title: string
  category: string
  persona: string
  difficulty: number
}

export function buildScenarioAnalyticsProps(
  scenario: ScenarioAnalyticsItem,
  props: ScenarioAnalyticsProps = {}
): ScenarioAnalyticsProps {
  return {
    scenario_slug: scenario.slug,
    scenario_title: scenario.title,
    scenario_category: scenario.category,
    scenario_persona: scenario.persona,
    scenario_difficulty: scenario.difficulty,
    ...props,
  }
}

export function trackScenarioEvent(
  event: ScenarioAnalyticsEventName,
  scenario: ScenarioAnalyticsItem,
  props: ScenarioAnalyticsProps = {},
  tracker: ScenarioAnalyticsTracker = trackEvent
): void {
  tracker(event, buildScenarioAnalyticsProps(scenario, props))
}

export function trackScenarioCatalogEvent(
  props: ScenarioAnalyticsProps,
  tracker: ScenarioAnalyticsTracker = trackEvent
): void {
  tracker(SCENARIO_ANALYTICS_EVENTS.catalogViewed, props)
}
