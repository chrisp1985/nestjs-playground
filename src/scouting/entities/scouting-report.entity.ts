
import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('scouting_reports')
export class ScoutingReport {
  @PrimaryColumn('uuid')
  reportId: string;

  @Column({ type: 'int' })
  playerNo: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  requestedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
