
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutingReport } from './entities/scouting-report.entity.js';
import { ScoutingService } from './scouting.service.js';
import type { ScoutingRequestMessage } from '../sqs/messages/scouting-request.message.js';
import { LlmService } from '../llm/llm.service.js';
import { parseScoutingAnalysis } from '../llm/dto/scouting-analysis.dto.js';
import { SeniorScoutingEvaluationService } from './senior-scouting-evaluation.service.js';
import { rankPolicies } from './training-policy-retrieval.js';
import { TRAINING_POLICIES } from './training-policy-catalogue.js';

@Injectable()
export class ScoutingReportService {
  constructor(
    @InjectRepository(ScoutingReport)
    private readonly reports: Repository<ScoutingReport>,
    private readonly scouting: ScoutingService,
    private readonly llm: LlmService,
    private readonly seniorScouting: SeniorScoutingEvaluationService,
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

    const policies = rankPolicies('promotion evidence', TRAINING_POLICIES);

    const result = await this.scouting.findOne(
      message.playerNo,
    );

    const rawAnalysis = await this.llm.analyseScoutingReport({
      scouting: result,
      policies: policies
    });
    
    const analysis = parseScoutingAnalysis(rawAnalysis);

    const seniorEvaluation = await this.seniorScouting.evaluate(message.playerNo);

    await this.reports.save({
        reportId: message.reportId,
        playerNo: message.playerNo,
        status: 'completed',
        result: {
          scouting: { ...result },
          analysis: { ...analysis },
          seniorEvaluation,
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
