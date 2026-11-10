
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutingReport } from './entities/scouting-report.entity.js';
import { ScoutingService } from './scouting.service.js';
import type { ScoutingRequestMessage } from '../sqs/messages/scouting-request.message.js';

@Injectable()
export class ScoutingReportService {
  constructor(
    @InjectRepository(ScoutingReport)
    private readonly reports: Repository<ScoutingReport>,
    private readonly scouting: ScoutingService,
  ) {}

  async process(
    message: ScoutingRequestMessage,
  ): Promise<void> {
    const existing = await this.reports.findOneBy({
      reportId: message.reportId,
    });

    if (existing?.status === 'completed') {
      return;
    }

    const result = await this.scouting.findOne(
      message.playerNo,
    );

    await this.reports.save({
        reportId: message.reportId,
        playerNo: message.playerNo,
        status: 'completed',
        result: result as unknown as Record<string, unknown>,
        requestedAt: new Date(message.requestedAt),
        completedAt: new Date(),
    });
  }
}
