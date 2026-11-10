import { Module } from '@nestjs/common';
import { SqsPublisherService } from './sqs-publisher.service.js';

@Module({
  providers: [SqsPublisherService],
  exports: [SqsPublisherService],
})
export class SqsModule {}