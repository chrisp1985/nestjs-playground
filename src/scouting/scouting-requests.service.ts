import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SqsPublisherService } from '../sqs/sqs-publisher.service.js';

@Injectable()
export class ScoutingRequestsService {
  constructor(
    private readonly sqsPublisher: SqsPublisherService,
  ) {}

  async requestReport(playerNo: number) {
    const reportId = randomUUID();

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
