import { Injectable } from "@nestjs/common";
import { LlmService } from "./llm.service.js";
import { ScoutingResponse } from "../scouting/dto/scouting-response.dto.js";
import { ScoutingAnalysis } from "./dto/scouting-analysis.dto.js";
import { SeniorScoutingEvaluationInput, SeniorScoutingEvaluation } from "./dto/senior-scouting-evaluation.dto.js";

@Injectable()
export class FakeLlmService extends LlmService {
    async evaluateSeniorPlayer(
    input: SeniorScoutingEvaluationInput,
    ): Promise<SeniorScoutingEvaluation> {
    return {
        summary: `Fake evaluation for ${input.competition} ${input.season}.`,
        comparisons: [
        { metric: 'goalsPer90', observation: 'Placeholder for local testing.' },
        ],
        limitations: ['No model was called.'],
    };
    }
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