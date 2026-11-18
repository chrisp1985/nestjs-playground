import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service.js';
import type {
  SeniorScoutingEvaluation,
} from '../llm/dto/senior-scouting-evaluation.dto.js';
import { SeniorScoutingEvidenceService } from './senior-scouting-evidence.service.js';

@Injectable()
export class SeniorScoutingEvaluationService {
  constructor(
    private readonly evidence: SeniorScoutingEvidenceService,
    private readonly llm: LlmService,
  ) {}

  async evaluate(playerNo: number): Promise<SeniorScoutingEvaluation | null> {
    const players = await this.evidence.findEvidence(playerNo, 269);

    if (players === null) {
      return null;
    }

    return this.llm.evaluateSeniorPlayer({
      competition: 'Premier League',
      season: '2025/26',
      source: '11footy, 2026-11-10 release',
      players,
    });
  }
}