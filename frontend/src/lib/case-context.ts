export type DesiredOutput = 'pressure_scan' | 'full_rewrite' | 'brief' | 'rehearsal';

export type CaseSituationId =
  | 'budget_defense'
  | 'client_escalation'
  | 'investor_pitch'
  | 'qbr'
  | 'roadmap_defense'
  | 'stakeholder_update';

export type DraftCaseContext = {
  situation_id: CaseSituationId | string;
  situation_label: string;
  opponent_role?: string | null;
  desired_output: DesiredOutput;
  stakes?: string | null;
  success_criteria?: string | null;
};

export type CaseSituation = {
  id: CaseSituationId;
  label: string;
  shortLabel: string;
  description: string;
  opponentRole: string;
  desiredOutput: DesiredOutput;
  focus: string;
};

export const CASE_SITUATIONS: CaseSituation[] = [
  {
    id: 'budget_defense',
    label: 'Защита бюджета',
    shortLabel: 'Бюджет',
    description: 'Нужно объяснить, почему расходы нельзя резать без потери результата.',
    opponentRole: 'CFO / руководитель',
    desiredOutput: 'pressure_scan',
    focus: 'ROI, trade-off, цена задержки, что можно урезать первым.',
  },
  {
    id: 'client_escalation',
    label: 'Клиентская эскалация',
    shortLabel: 'Клиент',
    description: 'Нужно вернуть доверие, объяснить сбой или защитить продление.',
    opponentRole: 'Недовольный клиент',
    desiredOutput: 'full_rewrite',
    focus: 'ответственность, гарантии, план восстановления, следующий шаг.',
  },
  {
    id: 'investor_pitch',
    label: 'Инвесторский pitch',
    shortLabel: 'Инвестор',
    description: 'Нужно выдержать вопросы по рынку, росту, экономике и плану.',
    opponentRole: 'Инвестор',
    desiredOutput: 'brief',
    focus: 'рынок, рост, unit-экономика, слабые допущения.',
  },
  {
    id: 'qbr',
    label: 'QBR / renewal review',
    shortLabel: 'QBR',
    description: 'Нужно показать ценность, прогресс, риски и следующий квартал.',
    opponentRole: 'Клиентский комитет',
    desiredOutput: 'brief',
    focus: 'ценность, метрики, открытые риски, renewal ask.',
  },
  {
    id: 'roadmap_defense',
    label: 'Защита roadmap',
    shortLabel: 'Roadmap',
    description: 'Нужно защитить приоритеты и объяснить, что не попадет в план.',
    opponentRole: 'CEO / стейкхолдеры',
    desiredOutput: 'pressure_scan',
    focus: 'приоритизация, цена отказа, зависимости, критерий решения.',
  },
  {
    id: 'stakeholder_update',
    label: 'Сложный stakeholder update',
    shortLabel: 'Стейкхолдер',
    description: 'Нужно сообщить неприятный статус и удержать доверие к плану.',
    opponentRole: 'Жесткий стейкхолдер',
    desiredOutput: 'rehearsal',
    focus: 'риски, owner, реалистичный next step, границы обещаний.',
  },
];

export const DEFAULT_CASE_SITUATION_ID: CaseSituationId = 'budget_defense';

export function getCaseSituation(id?: string | null): CaseSituation {
  return CASE_SITUATIONS.find((item) => item.id === id) ?? CASE_SITUATIONS[0];
}

export function getCaseSituationIdForScenario(category?: string | null, slug?: string | null): CaseSituationId {
  if (slug?.includes('client') || category === 'clients') return 'client_escalation';
  if (slug?.includes('series') || slug?.includes('investor') || category === 'investors') return 'investor_pitch';
  if (slug?.includes('qbr')) return 'qbr';
  if (slug?.includes('roadmap') || category === 'roadmap') return 'roadmap_defense';
  if (category === 'people' || category === 'crisis') return 'stakeholder_update';
  return 'budget_defense';
}

export function buildDraftCaseContext(
  situationId: string,
  details?: { stakes?: string; successCriteria?: string },
): DraftCaseContext {
  const situation = getCaseSituation(situationId);
  return {
    situation_id: situation.id,
    situation_label: situation.label,
    opponent_role: situation.opponentRole,
    desired_output: situation.desiredOutput,
    stakes: details?.stakes?.trim() || undefined,
    success_criteria: details?.successCriteria?.trim() || undefined,
  };
}
