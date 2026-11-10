
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { ScoutingRequestMessage } from './messages/scouting-request.message.js';

@Injectable()
export class SqsPublisherService implements OnModuleDestroy {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly config: ConfigService) {
    this.queueUrl = this.config.getOrThrow<string>(
      'SCOUTING_QUEUE_URL',
    );

    this.client = new SQSClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async publishScoutingRequest(
    message: ScoutingRequestMessage,
  ): Promise<string> {
    const response = await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );

    if (!response.MessageId) {
      throw new Error('SQS returned no message ID');
    }

    return response.MessageId;
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}

