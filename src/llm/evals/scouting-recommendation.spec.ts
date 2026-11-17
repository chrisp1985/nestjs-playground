import type { ScoutingAnalysis } from '../dto/scouting-analysis.dto.js';
import type { ScoutingResponse } from '../../scouting/dto/scouting-response.dto.js';

type ScoutingEvalCase = {
  input: ScoutingResponse;
  expectedRecommendation: ScoutingAnalysis['recommendation'];
};

const limitedEvidenceCase: ScoutingEvalCase = {
  input: {
    playerId: 1,
    potential: 85,
    report: 'Strong technical ability in training. No senior match evidence yet.',
  },
  expectedRecommendation: 'retain'
};

function matchesExpectedRecommendation(
  evalCase: ScoutingEvalCase,
  candidate: ScoutingAnalysis,
): boolean {
  return candidate.recommendation === evalCase.expectedRecommendation;
}

describe('Scouting Recommendations', () => {
    it('rejects promotion when senior match evidence is missing', () => {
        const candidate: ScoutingAnalysis = {
            summary: 'Ready for senior football.',
            recommendation: 'promote',
            reasons: ['Has consistently performed well in senior matches.'],
        };

        expect(
            matchesExpectedRecommendation(limitedEvidenceCase, candidate),
            ).toBe(false);
    });

    it('accepts retain when senior match evidence is missing', () => {
        const candidate: ScoutingAnalysis = {
            summary: 'Promising in training, but not yet proven in senior matches.',
            recommendation: 'retain',
            reasons: ['Shows strong technical ability in training.'],
        };

        expect(
            matchesExpectedRecommendation(limitedEvidenceCase, candidate),
            ).toBe(true);
    });    
});