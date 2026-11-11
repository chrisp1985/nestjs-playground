import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SqsPublisherService } from '../sqs/sqs-publisher.service.js';
import { ScoutingReportService } from './scouting-report.service.js';

@Injectable()
export class ScoutingRequestsService {
  constructor(
    private readonly sqsPublisher: SqsPublisherService,
    private readonly scoutingReports: ScoutingReportService
  ) {}

  async requestReport(playerNo: number) {
    const reportId = randomUUID();
    const requestedAt = new Date().toISOString();

    await this.scoutingReports.createQueued(
      reportId,
      playerNo,
      requestedAt,
    );

    await this.sqsPublisher.publishScoutingRequest({
      reportId,
      playerNo,
      requestedAt: new Date().toISOString(),
    });

    return {
      reportId,
      status: 'queued' as const,
    };
  }
}
