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
@Module({
  imports: [
    HttpModule, 
    SqsModule,
    TypeOrmModule.forFeature([ScoutingReport])
  ],
  controllers: [
    ScoutingController, 
    ScoutingReportsController
  ],
  providers: [
    ScoutingService, 
    ScoutingRequestsService,
    ScoutingReportService,
    SqsConsumerService
  ],
})
export class ScoutingModule {}