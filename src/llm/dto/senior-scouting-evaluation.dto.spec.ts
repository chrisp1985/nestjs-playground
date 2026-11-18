import { describe, expect, it } from 'vitest';
import { parseSeniorScoutingEvaluation } from './senior-scouting-evaluation.dto.js';

describe('parseSeniorScoutingEvaluation', () => {
  const evaluation = {
    summary: 'Haaland led the selected peers in goals per 90.',
    comparisons: [
      {
        metric: 'goalsPer90',
        observation: 'Haaland recorded 0.82 goals per 90.',
      },
    ],
    limitations: ['Only three peers from one season were compared.'],
  };

  it('accepts a valid evaluation', () => {
    expect(parseSeniorScoutingEvaluation(evaluation)).toEqual(evaluation);
  });

  it('rejects a metric outside the supported set', () => {
    const invalid = {
      ...evaluation,
      comparisons: [
        { ...evaluation.comparisons[0], metric: 'assistsPer90' },
      ],
    };

    expect(() => parseSeniorScoutingEvaluation(invalid)).toThrow(
      'Invalid comparison metric or observation.',
    );
  });
});