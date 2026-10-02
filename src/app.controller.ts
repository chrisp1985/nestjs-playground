import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): string {
    return this.appService.getStatus();
  }

  @Get('status/check')
  getStatusCheck(): string {
    return this.appService.getStatusCheck();
  }
}
