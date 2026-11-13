import { Injectable } from '@nestjs/common';
import type { ScoutingAnalysis } from './dto/scouting-analysis.dto.js';
import type { ScoutingResponse } from '../scouting/dto/scouting-response.dto.js';

@Injectable()
export abstract class LlmService {
abstract analyseScoutingReport(scouting: ScoutingResponse): Promise<unknown>;
}