import { expect, it } from 'vitest';
import { rankPolicies, type ScoutingPolicy } from './policy-retrieval.js';

const policies: ScoutingPolicy[] = [
  {
    id: 'retention',
    text: 'Retention decisions consider training evidence and development potential.',
  },
  {
    id: 'promotion',
    text: 'Promotion requires evidence of senior match performance.',
  },
  {
    id: 'reporting',
    text: 'Scouts must submit written reports after each assessment.',
  },
];

it('ranks the promotion policy first for a promotion evidence query', () => {
    const results = rankPolicies('promotion evidence', policies);

    expect(results.map((policy) => policy.id)).toEqual([
        'promotion',
        'retention',
    ]);
});

it('returns no policies when no query terms match', () => {
  const results = rankPolicies('stadium parking', policies);

  expect(results).toEqual([]);
});