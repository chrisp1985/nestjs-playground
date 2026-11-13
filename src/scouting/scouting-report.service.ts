
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutingReport } from './entities/scouting-report.entity.js';
import { ScoutingService } from './scouting.service.js';
import type { ScoutingRequestMessage } from '../sqs/messages/scouting-request.message.js';
import { LlmService } from '../llm/llm.service.js';

@Injectable()
export class ScoutingReportService {
  constructor(
    @InjectRepository(ScoutingReport)
    private readonly reports: Repository<ScoutingReport>,
    private readonly scouting: ScoutingService,
    private readonly llm: LlmService,
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

    const analysis = await this.llm.analyseScoutingReport(result);

    await this.reports.save({
        reportId: message.reportId,
        playerNo: message.playerNo,
        status: 'completed',
        result: {
          scouting: { ...result },
          analysis: { ...analysis },
        },
        requestedAt: new Date(message.requestedAt),
        completedAt: new Date(),
    });
  }

  async findById(reportId: string): Promise<ScoutingReport> {
    const report = await this.reports.findOneBy({
      reportId,
    });

    if (!report) {
      throw new NotFoundException (
        `Scouting report ${reportId} not found`,
      );
    }
    return report;
  }

  async createQueued(
    reportId: string,
    playerNo: number,
    requestedAt: string,
  ): Promise<void> {
    await this.reports.insert({
      reportId,
      playerNo,
      status: 'queued',
      result: null,
      requestedAt: new Date(requestedAt),
      completedAt: null,
    });
  }

}
