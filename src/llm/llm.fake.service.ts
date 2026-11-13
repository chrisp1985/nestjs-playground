import { Injectable } from "@nestjs/common";
import { LlmService } from "./llm.service.js";
import { ScoutingResponse } from "../scouting/dto/scouting-response.dto.js";
import { ScoutingAnalysis } from "./dto/scouting-analysis.dto.js";

@Injectable()
export class FakeLlmService extends LlmService {
    async analyseScoutingReport(scouting: ScoutingResponse): Promise<ScoutingAnalysis> {
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