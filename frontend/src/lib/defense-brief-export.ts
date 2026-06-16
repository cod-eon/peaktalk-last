export type DefenseBriefArtifact = {
  opening_move?: string | null;
  top_arguments?: { text?: string | null; strength?: string | null; anchor_phrase?: string | null }[] | null;
  anchor_phrases?: string[] | null;
  danger_zones?: { topic?: string | null; risk?: string | null; suggested_response?: string | null }[] | null;
  key_numbers?: string[] | null;
};

const STRENGTH_LABELS: Record<string, string> = {
  high: 'сильный аргумент',
  medium: 'рабочий аргумент, стоит усилить формулировкой',
  low: 'слабый аргумент, нужен факт или расчет',
};

function cleanText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function pushSection(lines: string[], title: string): void {
  if (lines.length > 0 && lines[lines.length - 1] !== '') {
    lines.push('');
  }
  lines.push(`## ${title}`);
}

export function formatDefenseBriefMarkdown(artifact: DefenseBriefArtifact): string {
  const lines: string[] = [
    '# Defense Brief',
    '',
    'Сформирован на базе вашей симуляции PeakTalk.',
  ];

  const openingMove = cleanText(artifact.opening_move);
  if (openingMove) {
    pushSection(lines, 'Рекомендуемый старт');
    lines.push(openingMove);
  }

  const topArguments = (artifact.top_arguments ?? []).filter((arg) => cleanText(arg.text));
  if (topArguments.length > 0) {
    pushSection(lines, 'Ключевые тезисы');
    topArguments.forEach((arg, index) => {
      const text = cleanText(arg.text);
      const strength = STRENGTH_LABELS[cleanText(arg.strength)] ?? cleanText(arg.strength);
      const anchorPhrase = cleanText(arg.anchor_phrase);

      lines.push(`${index + 1}. ${text}`);
      if (strength) {
        lines.push(`   - **Оценка:** ${strength}.`);
      }
      if (anchorPhrase) {
        lines.push(`   - **Опорная формулировка:** "${anchorPhrase}"`);
      }
    });
  }

  const anchorPhrases = (artifact.anchor_phrases ?? []).map(cleanText).filter(Boolean);
  if (anchorPhrases.length > 0) {
    pushSection(lines, 'Формулировки, которые стоит забрать на встречу');
    anchorPhrases.forEach((phrase) => {
      lines.push(`- "${phrase}"`);
    });
  }

  const dangerZones = (artifact.danger_zones ?? []).filter(
    (zone) => cleanText(zone.topic) || cleanText(zone.risk) || cleanText(zone.suggested_response),
  );
  if (dangerZones.length > 0) {
    pushSection(lines, 'Зоны риска и возражения');
    dangerZones.forEach((zone, index) => {
      const topic = cleanText(zone.topic) || `Риск ${index + 1}`;
      const risk = cleanText(zone.risk);
      const suggestedResponse = cleanText(zone.suggested_response);

      lines.push(`### ${index + 1}. ${topic}`);
      if (risk) {
        lines.push(`- **Риск:** ${risk}`);
      }
      if (suggestedResponse) {
        lines.push(`- **Как отвечать:** ${suggestedResponse}`);
      }
    });
  }

  const keyNumbers = (artifact.key_numbers ?? []).map(cleanText).filter(Boolean);
  if (keyNumbers.length > 0) {
    pushSection(lines, 'Цифры, которые нужно запомнить');
    keyNumbers.forEach((number) => {
      lines.push(`- ${number}`);
    });
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function buildDefenseBriefFilename(sessionId: string): string {
  const safeId = sessionId
    .trim()
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

  return `peaktalk-defense-brief-${safeId || 'session'}.md`;
}
