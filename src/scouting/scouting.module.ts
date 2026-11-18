import { HttpModule } from "@nestjs/axios";
import { Module } from '@nestjs/common';
import { ScoutingController } from "./scouting.controller.js";
import { ScoutingService } from "./scouting.service.js";
import { SqsModule } from "../sqs/sqs.module.js";
import { ScoutingRequestsService } from "./scouting-requests.service.js";
import { SqsConsumerService } from "../sqs/sqs-consumer.service.js";
import { ScoutingReport } from "./entities/scouting-report.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScoutingReportService } from "./scouting-report.service.js";
import { ScoutingReportsController } from "./scouting-reports.controller.js";
import { LlmModule } from '../llm/llm.module.js';
import { SeniorScoutingEvidenceService } from "./senior-scouting-evidence.service.js";
import { SeniorScoutingEvaluationService } from "./senior-scouting-evaluation.service.js";

@Module({
  imports: [
    HttpModule, 
    SqsModule,
    TypeOrmModule.forFeature([ScoutingReport]),
    LlmModule
  ],
  controllers: [
    ScoutingController, 
    ScoutingReportsController
  ],
  providers: [
    ScoutingService, 
    ScoutingRequestsService,
    ScoutingReportService,
    SqsConsumerService,
    SeniorScoutingEvidenceService,
    SeniorScoutingEvaluationService
  ],
})
export class ScoutingModule {}