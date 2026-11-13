import type Anthropic from '@anthropic-ai/sdk';
import type { ScoutingResponse } from '../scouting/dto/scouting-response.dto.js';
import { SCOUTING_RECOMMENDATIONS } from './dto/scouting-analysis.dto.js';
import { LlmService } from './llm.service.js';

export class AnthropicLlmService extends LlmService {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {
    super();
  }

  async analyseScoutingReport(scouting: ScoutingResponse): Promise<unknown> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      system: 'Analyse the supplied scouting data. Base the recommendation and reasons only on that data.',
      messages: [{ role: 'user', content: JSON.stringify(scouting) }],
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