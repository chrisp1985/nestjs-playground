import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService, type Status } from './app.service.js';

@ApiTags('status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Liveness check (does not touch the database)' })
  @ApiOkResponse({
    schema: { type: 'object', properties: { status: { example: 'up' } } },
  })
  getStatus(): Status {
    return this.appService.getStatus();
  }

  @Get('status/check')
  @ApiOkResponse({ schema: { type: 'string', example: 'Status Checked.' } })
  getStatusCheck(): string {
    return this.appService.getStatusCheck();
  }
}
