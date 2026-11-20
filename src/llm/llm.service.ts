import { Injectable } from '@nestjs/common';
import { SeniorScoutingEvaluation, SeniorScoutingEvaluationInput } from './dto/senior-scouting-evaluation.dto.js';
import type { ScoutingAnalysisInput } from './dto/scouting-analysis-input.dto.js';

@Injectable()
export abstract class LlmService {
abstract analyseScoutingReport(input: ScoutingAnalysisInput): Promise<unknown>;
abstract evaluateSeniorPlayer(
  input: SeniorScoutingEvaluationInput,
): Promise<SeniorScoutingEvaluation>;
}

