import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { FakeLlmService } from './llm.fake.service.js';

@Module({
  providers: [{ provide: LlmService, useClass: FakeLlmService }],
  exports: [LlmService],
})
export class LlmModule {}