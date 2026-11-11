
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ScoutingReportService } from './scouting-report.service.js';

@Controller('scouting-reports')
export class ScoutingReportsController {
  constructor(
    private readonly reports: ScoutingReportService,
  ) {}

  @Get(':reportId')
  findOne(
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ) {
    return this.reports.findById(reportId);
  }
}