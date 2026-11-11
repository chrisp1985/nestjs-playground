import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SqsPublisherService } from './sqs-publisher.service.js';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';

describe('SqsPublisherService', () => {
  let publisher: SqsPublisherService;

  beforeEach(() => {
    const config = {
      getOrThrow: vi.fn((key: string) => {
        const values: Record<string, string> = {
          SCOUTING_QUEUE_URL:
            'https://sqs.eu-west-2.amazonaws.com/123/test',
          AWS_REGION: 'eu-west-2',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    publisher = new SqsPublisherService(config);
  });

  afterEach(() => {
    publisher.onModuleDestroy();
    vi.restoreAllMocks();
  });

  it('returns the SQS message ID after successful publishing', async () => {
    const sendSpy = vi
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(async () => ({
        MessageId: 'sqs-message-123',
        $metadata: {},
      }));

    const request = {
      reportId: 'report-123',
      playerNo: 42,
      requestedAt: '2026-11-10T12:00:00.000Z',
    };

    const result = await publisher.publishScoutingRequest(request);
    const command = sendSpy.mock.calls[0][0];

    expect(result).toBe('sqs-message-123');
    expect(sendSpy).toHaveBeenCalledWith(
      expect.any(SendMessageCommand),
    );
    if (!(command instanceof SendMessageCommand)) {
      throw new Error('Expected SendMessageCommand');
    }
    expect(command.input.QueueUrl).toBe(
      'https://sqs.eu-west-2.amazonaws.com/123/test',
    );

    expect(JSON.parse(command.input.MessageBody!)).toEqual(request);
  });

  it('shows as SQS unavailable when SQS rejects a publish request', async () => {

    const request = {
      reportId: 'report-123',
      playerNo: 43,
      requestedAt: '2026-11-10T12:00:00.000Z',
    };
    
    const sendSpy = vi.spyOn(SQSClient.prototype, 'send')
      .mockRejectedValue(
        new Error('SQS unavailable')
      );

    const result = publisher.publishScoutingRequest(request);
    await expect(result).rejects.toThrow('SQS unavailable');
  });

  it('throws when SQS returns no MessageId', async () => {
    const request = {
      reportId: 'report-123',
      playerNo: 43,
      requestedAt: '2026-11-10T12:00:00.000Z',
    };

    const sendSpy = vi.spyOn(SQSClient.prototype, 'send')
      .mockImplementation(async () => ({
        $metadata: {},
      }));

    const result = publisher.publishScoutingRequest(request);
    await expect(result).rejects.toThrow('SQS returned no message ID');
  });  
});