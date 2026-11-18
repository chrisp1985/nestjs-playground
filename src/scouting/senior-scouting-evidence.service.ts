import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { calculatePer90 } from './senior-scouting-metrics.js';

type EvidenceRow = {
  sourcePlayerId: number;
  playerName: string;
  minutes: number;
  goals: number;
  shots: number;
  isSubject: boolean;
};

@Injectable()
export class SeniorScoutingEvidenceService {
  constructor(private readonly dataSource: DataSource) {}

  async findEvidence(playerNo: number, seasonId: number) {
    const rows = await this.dataSource.query<EvidenceRow[]>(
      `
      SELECT
        t.source_player_id AS "sourcePlayerId",
        t.player_name AS "playerName",
        t.minutes,
        t.goals,
        t.shots,
        (t.source_player_id = m.source_player_id) AS "isSubject"
      FROM senior_scouting_season_totals AS t
      JOIN senior_scouting_player_map AS m ON m.playerno = $1
      WHERE t.source_season_id = $2
      ORDER BY "isSubject" DESC, t.source_player_id
      `,
      [playerNo, seasonId],
    );

    const subject = rows.find((row) => row.isSubject && row.minutes > 0);

    if (!subject) {
        return null;
    }

    return rows.map((row) => ({
        ...row,
        ...calculatePer90(row),
    }));
  }
}