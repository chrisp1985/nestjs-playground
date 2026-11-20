import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { AnthropicLlmService } from './llm.anthropic.service.js';
import type { ScoutingAnalysisInput } from './dto/scouting-analysis-input.dto.js';

describe('AnthropicLlmService', () => {
  it('parses a completed Claude response into a scouting analysis object', async () => {
    const expectedInput: ScoutingAnalysisInput = {
        scouting: {
          playerId: 1,
          potential: 85,
          report: 'Strong technical ability',
        },
        policies: [
            {
                id: 'promotion',
                text: 'Promotion requires evidence of senior match performance.',
            },
        ],
    };

    const expectedAnalysis = {
      summary: 'Promising player',
      recommendation: 'retain',
      reasons: ['Strong technical ability'],
    };

    const create = vi.fn().mockResolvedValue({
      stop_reason: 'end_turn',
      content: [
        { type: 'text', text: JSON.stringify(expectedAnalysis) },
      ],
    });

    const client = { messages: { create } };
    const service = new AnthropicLlmService(
      client as unknown as Anthropic,
      'test-model',
    );

    await expect(service.analyseScoutingReport(expectedInput)).resolves.toEqual(
      expectedAnalysis,
    );

    const request = create.mock.calls[0][0];
    const payload = JSON.parse(request.messages[0].content);
    expect(payload).toEqual(expectedInput);
  });

  it('rejects a Claude response stopped by the token limit', async () => {
    const scouting = {
      playerId: 1,
      potential: 85,
      report: 'Strong technical ability',
    };

    const expectedAnalysis = {
      summary: 'Promising player',
      recommendation: 'retain',
      reasons: ['Strong technical ability'],
    };

    const create = vi.fn().mockResolvedValue({
      stop_reason: 'max_tokens',
      content: [
        { type: 'text', text: JSON.stringify(expectedAnalysis) },
      ],
    });

    const client = { messages: { create } };
    const service = new AnthropicLlmService(
      client as unknown as Anthropic,
      'test-model',
    );

    await expect(service.analyseScoutingReport({ scouting, policies: [] })).rejects.toThrow(
    'Claude did not return a complete scouting analysis.',
    );
  });  
});