import { object } from "joi";

export const SENIOR_SCOUTING_METRICS = ['goalsPer90', 'shotsPer90'] as const;

type SeniorScoutingMetric = (typeof SENIOR_SCOUTING_METRICS)[number];

export type SeniorScoutingEvaluation = {
  summary: string;
  comparisons: {
    metric: SeniorScoutingMetric;
    observation: string;
  }[];
  limitations: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseSeniorScoutingEvaluation(value: unknown,): SeniorScoutingEvaluation {
  if (!isObject(value)) {
    throw new Error('Invalid senior scouting evaluation.');
  }

  const { summary, comparisons, limitations } = value;

  if (!isNonBlankString(summary)) {
    throw new Error('Invalid evaluation summary.');
  }

  if (!Array.isArray(comparisons) || comparisons.length === 0) {
    throw new Error('Expected at least one comparison.');
  }

  const parsedComparisons: SeniorScoutingEvaluation['comparisons'] = [];

  for (const item of comparisons) {
    if (!isObject(item)) {
      throw new Error('Invalid comparison object.');
    }

    const { metric: rawMetric, observation } = item;
    const metric = SENIOR_SCOUTING_METRICS.find(
      (allowed) => allowed === rawMetric,
    );

    if (metric === undefined || !isNonBlankString(observation)) {
      throw new Error('Invalid comparison metric or observation.');
    }

    parsedComparisons.push({ metric, observation });
  }

  if (!Array.isArray(limitations) || limitations.length === 0) {
    throw new Error('Expected at least one limitation.');
  }

  const parsedLimitations: string[] = [];

  for (const limitation of limitations) {
    if (!isNonBlankString(limitation)) {
      throw new Error('Invalid evaluation limitation.');
    }

    parsedLimitations.push(limitation);
  }

  return {
    summary,
    comparisons: parsedComparisons,
    limitations: parsedLimitations,
  };
}

export type SeniorScoutingEvaluationInput = {
  competition: string;
  season: string;
  source: string;
  players: {
    playerName: string;
    isSubject: boolean;
    minutes: number;
    goals: number;
    shots: number;
    goalsPer90: number | null;
    shotsPer90: number | null;
  }[];
};