import assert from 'node:assert/strict';
import { formatDefenseBriefMarkdown } from './defense-brief-export.js';
import {
  EXAMPLE_DEFENSE_BRIEF,
  EXAMPLE_DEFENSE_BRIEF_CONTEXT_NOTE,
  isExampleDefenseBrief,
} from './example-defense-brief.js';

assert.equal(isExampleDefenseBrief(EXAMPLE_DEFENSE_BRIEF), true);

const note = EXAMPLE_DEFENSE_BRIEF_CONTEXT_NOTE.toLowerCase();
assert.match(note, /пример формата/);
assert.match(note, /не анализ вашего материала/);

const markdown = formatDefenseBriefMarkdown(EXAMPLE_DEFENSE_BRIEF);

assert.match(markdown, /защита roadmap\/budget/i);
assert.match(markdown, /CEO\/CFO/);
assert.match(markdown, /\[ваша/);
assert.ok((EXAMPLE_DEFENSE_BRIEF.top_arguments ?? []).length >= 2);
assert.ok((EXAMPLE_DEFENSE_BRIEF.danger_zones ?? []).length >= 2);
assert.ok((EXAMPLE_DEFENSE_BRIEF.anchor_phrases ?? []).length >= 2);
assert.doesNotMatch(markdown, /testimonial|soc2|gdpr|логотип|гарант/i);
