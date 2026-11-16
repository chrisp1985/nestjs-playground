import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { ConfigService } from '@nestjs/config';
import { FakeLlmService } from './llm.fake.service.js';
import { AnthropicLlmService } from './llm.anthropic.service.js';
import Anthropic from '@anthropic-ai/sdk';

@Module({
  providers: [{
    provide: LlmService,
    inject: [ConfigService],
    useFactory: (config: ConfigService): LlmService => {
    const provider = config.get<string>('LLM_PROVIDER', 'fake');

    if (provider === 'fake') {
      return new FakeLlmService();
    }

    if (provider !== 'anthropic') {
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
    }

    const apiKey = config.getOrThrow<string>('ANTHROPIC_API_KEY');
    const model = config.getOrThrow<string>('ANTHROPIC_MODEL');

    const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 0 });
    return new AnthropicLlmService(client, model);
  },
  }],
  exports: [LlmService],
})
export class LlmModule {}