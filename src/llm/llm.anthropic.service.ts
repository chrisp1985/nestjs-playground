import type Anthropic from '@anthropic-ai/sdk';
import type { ScoutingResponse } from '../scouting/dto/scouting-response.dto.js';
import { SCOUTING_RECOMMENDATIONS } from './dto/scouting-analysis.dto.js';
import { LlmService } from './llm.service.js';
import { SENIOR_SCOUTING_METRICS } from './dto/senior-scouting-evaluation.dto.js';
import { parseSeniorScoutingEvaluation } from './dto/senior-scouting-evaluation.dto.js';
import { SeniorScoutingEvaluation, SeniorScoutingEvaluationInput } from './dto/senior-scouting-evaluation.dto.js';
import { ScoutingAnalysisInput } from './dto/scouting-analysis-input.dto.js';

export class AnthropicLlmService extends LlmService {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {
    super();
  }

  async evaluateSeniorPlayer(
    input: SeniorScoutingEvaluationInput,
  ): Promise<SeniorScoutingEvaluation> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: [
        'Evaluate the player marked isSubject using only the supplied evidence.',
        'Compare the subject with the supplied peers using the supplied per-90 rates.',
        'Use minutes to explain differences in sample size. Treat null rates as unavailable.',
        'State the competition, season, and limits of this comparison.',
        'Do not infer a league-wide ranking, current form, or club fit.',
      ].join(' '),
      messages: [{ role: 'user', content: JSON.stringify(input) }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              comparisons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string', enum: [...SENIOR_SCOUTING_METRICS] },
                    observation: { type: 'string' },
                  },
                  required: ['metric', 'observation'],
                  additionalProperties: false,
                },
              },
              limitations: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'comparisons', 'limitations'],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (response.stop_reason !== 'end_turn' || !textBlock?.text.trim()) {
      throw new Error('Claude did not return a complete senior scouting evaluation.');
    }

    const decoded: unknown = JSON.parse(textBlock.text);
    return parseSeniorScoutingEvaluation(decoded);
  }  

  async analyseScoutingReport(input: ScoutingAnalysisInput): Promise<unknown> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      system: 'Analyse the supplied scouting data. Base the recommendation and reasons only on that data.',
      messages: [{ role: 'user', content: JSON.stringify(input) }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              recommendation: {
                type: 'string',
                enum: [...SCOUTING_RECOMMENDATIONS],
              },
              reasons: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'recommendation', 'reasons'],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (response.stop_reason !== 'end_turn' || !textBlock?.text.trim()) {
      throw new Error('Claude did not return a complete scouting analysis.');
    }

    const decoded: unknown = JSON.parse(textBlock.text);
    return decoded;
  }
}

