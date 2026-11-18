import { Injectable } from '@nestjs/common';
import type { ScoutingResponse } from '../scouting/dto/scouting-response.dto.js';
import { SeniorScoutingEvaluation, SeniorScoutingEvaluationInput } from './dto/senior-scouting-evaluation.dto.js';

@Injectable()
export abstract class LlmService {
abstract analyseScoutingReport(scouting: ScoutingResponse): Promise<unknown>;
abstract evaluateSeniorPlayer(
  input: SeniorScoutingEvaluationInput,
): Promise<SeniorScoutingEvaluation>;
}

