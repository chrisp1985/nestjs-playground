import type { ScoutingResponse } from "../../scouting/dto/scouting-response.dto.js"
import type { ScoutingPolicy } from "../../scouting/training-policy-retrieval.js"

export type ScoutingAnalysisInput = {
    scouting: ScoutingResponse;
    policies: readonly ScoutingPolicy[];
}