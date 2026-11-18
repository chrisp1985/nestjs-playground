import { describe, expect, it } from 'vitest';
import { calculatePer90 } from './senior-scouting-metrics.js';

describe('calculatePer90', () => {
  it('calculates per-90 rates from Haaland’s season totals', () => {
    const result = calculatePer90({ minutes: 2979, goals: 27, shots: 126 });

    expect(result.goalsPer90).toBeCloseTo(0.8157, 4);
    expect(result.shotsPer90).toBeCloseTo(3.8066, 4);
  });

  it('returns unknown rates when no minutes were played', () => {
    expect(calculatePer90({ minutes: 0, goals: 0, shots: 0 })).toEqual({
      goalsPer90: null,
      shotsPer90: null,
    });
  });
});