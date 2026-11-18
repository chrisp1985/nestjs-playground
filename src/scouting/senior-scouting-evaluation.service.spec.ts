import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { LlmService } from '../llm/llm.service.js';
import { SeniorScoutingEvaluationService } from './senior-scouting-evaluation.service.js';
import { SeniorScoutingEvidenceService } from './senior-scouting-evidence.service.js';

describe('SeniorScoutingEvaluationService', () => {
  it('skips the LLM when there is no senior evidence', async () => {
    const findEvidence = vi.fn().mockResolvedValue(null);
    const evaluateSeniorPlayer = vi.fn();

    const module = await Test.createTestingModule({
      providers: [
        SeniorScoutingEvaluationService,
        { provide: SeniorScoutingEvidenceService, useValue: { findEvidence } },
        { provide: LlmService, useValue: { evaluateSeniorPlayer } },
      ],
    }).compile();

    const service = module.get(SeniorScoutingEvaluationService);

    expect(await service.evaluate(999)).toBeNull();
    expect(evaluateSeniorPlayer).not.toHaveBeenCalled();
  });
});