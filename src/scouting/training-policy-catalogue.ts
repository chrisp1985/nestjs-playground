import type { ScoutingPolicy } from './training-policy-retrieval.js';

export const TRAINING_POLICIES: readonly ScoutingPolicy[] = [
  {
    id: 'promotion',
    text: 'Promotion requires evidence of senior match performance.',
  },
  {
    id: 'reporting',
    text: 'Scouts must submit written reports after each assessment.',
  },
];