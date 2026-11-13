import { Injectable } from '@nestjs/common';
import type { ScoutingAnalysis } from './dto/scouting-analysis.dto.js';
import type { ScoutingResponse } from '../scouting/dto/scouting-response.dto.js';

@Injectable()
export class LlmService {
  async analyseScoutingReport(
    scouting: ScoutingResponse,
  ): Promise<ScoutingAnalysis> {
    return {
      summary: `Player ${scouting.playerId} has been assessed.`,
      recommendation: 'retain',
      reasons: [
        'Scouting assessment completed',
        'Further evaluation recommended',
      ],
    };
  }
}