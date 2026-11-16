import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { AnthropicLlmService } from './llm.anthropic.service.js';

describe('AnthropicLlmService', () => {
  it('parses a completed Claude response into a scouting analysis object', async () => {
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

    await expect(service.analyseScoutingReport(scouting)).resolves.toEqual(
      expectedAnalysis,
    );
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

    await expect(service.analyseScoutingReport(scouting)).rejects.toThrow(
    'Claude did not return a complete scouting analysis.',
    );
  });  
});