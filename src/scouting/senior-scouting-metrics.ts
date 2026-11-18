type SeasonTotals = {
  minutes: number;
  goals: number;
  shots: number;
};

type Per90Metrics = {
  goalsPer90: number | null;
  shotsPer90: number | null;
};

export function calculatePer90(totals: SeasonTotals): Per90Metrics {
  const result = {
    goalsPer90: totals.minutes === 0 ? null : totals.goals * 90 / totals.minutes,
    shotsPer90: totals.minutes === 0 ? null : totals.shots * 90 / totals.minutes
  }
  return result;
}