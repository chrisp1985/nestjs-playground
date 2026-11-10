
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { ScoutingService } from '../scouting/scouting.service.js';
import type { ScoutingRequestMessage } from './messages/scouting-request.message.js';
import { ScoutingReportService } from '../scouting/scouting-report.service.js';

@Injectable()
export class SqsConsumerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private readonly abortController = new AbortController();
  private pollingTask?: Promise<void>;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly scoutingReportService: ScoutingReportService,
  ) {
    this.queueUrl =
      this.config.getOrThrow<string>('SCOUTING_QUEUE_URL');

    this.client = new SQSClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  onApplicationBootstrap(): void {
    this.running = true;
    this.pollingTask = this.pollMessages();
  }

  async onApplicationShutdown(): Promise<void> {
    this.running = false;
    this.abortController.abort();

    await this.pollingTask;
    this.client.destroy();
  }

  private async pollMessages(): Promise<void> {
    while (this.running) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
          }),
          { abortSignal: this.abortController.signal },
        );

        if (!this.running) break;

        for (const message of response.Messages ?? []) {
          await this.processMessage(message);
        }
      } catch (error) {
        if (!this.running) break;

        this.logger.error(
          'SQS polling failed',
          error instanceof Error ? error.stack : String(error),
        );

        // Avoid a tight retry loop if SQS is unavailable.
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      throw new Error('Invalid SQS message');
    }

    const request = JSON.parse(
      message.Body,
    ) as ScoutingRequestMessage;

    this.logger.log(
      `Processing report ${request.reportId}`,
    );

    await this.scoutingReportService.process(request);

    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );

    this.logger.log(
      `Completed report ${request.reportId}`,
    );
  }
}
