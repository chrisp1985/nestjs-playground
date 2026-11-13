export const SCOUTING_RECOMMENDATIONS = [
  'promote',
  'retain',
  'release'
] as const;

export interface ScoutingAnalysis {
  summary: string;
  recommendation: (typeof SCOUTING_RECOMMENDATIONS)[number];
  reasons: string[];
}

export function parseScoutingAnalysis(input: unknown): ScoutingAnalysis {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Invalid scouting analysis.');
  }

  const rawRecommendation =
    'recommendation' in input ? input.recommendation : undefined;

  const recommendation = SCOUTING_RECOMMENDATIONS.find(
    (allowed) => allowed === rawRecommendation,
  );

  if (recommendation === undefined) {
    throw new Error('Invalid Recommendation received.');
  }

  const summary = 'summary' in input ? input.summary : undefined;
  if (typeof summary !== 'string') {
    throw new Error('Invalid analysis summary.');
  }

  const reasons = 'reasons' in input ? input.reasons : undefined;
  if (
    !Array.isArray(reasons) ||
    !reasons.every((reason: unknown): reason is string => typeof reason === 'string')
  ) {
    throw new Error('Invalid analysis reasons.');
  }

  return { summary, recommendation, reasons };
}