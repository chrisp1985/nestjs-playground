import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { SqsConsumerService } from './sqs-consumer.service.js';
import { ScoutingReportService } from '../scouting/scouting-report.service.js';

describe('SqsConsumerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes an SQS message after successful processing', async () => {
    const config = {
      getOrThrow: vi.fn((key: string) => {
        const values: Record<string, string> = {
          SCOUTING_QUEUE_URL: 'https://example.com/queue',
          AWS_REGION: 'eu-west-2',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const process = vi.fn().mockResolvedValue(undefined);

    const reportService = {
    process,
    } as unknown as ScoutingReportService;

    const consumer = new SqsConsumerService(config, reportService);

    const request = {
      reportId: 'report-123',
      playerNo: 42,
      requestedAt: '2026-11-10T12:00:00.000Z',
    };

    const message = {
      MessageId: 'sqs-message-123',
      ReceiptHandle: 'receipt-123',
      Body: JSON.stringify(request),
    };

    let signalDelete!: () => void;
    const deleted = new Promise<void>((resolve) => {
      signalDelete = resolve;
    });
    
    
    let receiveCount = 0;

    const sendSpy = vi
    .spyOn(SQSClient.prototype, 'send')
    .mockImplementation(async (command, options) => {
        if (command instanceof ReceiveMessageCommand) {
        receiveCount++;

        if (receiveCount === 1) {
            return { Messages: [message], $metadata: {} };
        }
        
        return new Promise((_, reject) => {
            const signal = options?.abortSignal;

            if (signal?.aborted) {
            reject(new Error('Polling aborted'));
            return;
            }

            signal?.addEventListener(
            'abort',
            () => reject(new Error('Polling aborted')),
            { once: true },
            );
        });
        }

        if (command instanceof DeleteMessageCommand) {
        signalDelete();
        return { $metadata: {} };
        }

        throw new Error('Unexpected SQS command');
    });

    consumer.onApplicationBootstrap();

    try {
    await deleted;

    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(request);

    const deleteCommands = sendSpy.mock.calls
        .map(([command]): unknown => command)
        .filter(
        (command): command is DeleteMessageCommand =>
            command instanceof DeleteMessageCommand,
        );

    expect(deleteCommands).toHaveLength(1);

    expect(deleteCommands[0].input).toEqual({
        QueueUrl: 'https://example.com/queue',
        ReceiptHandle: 'receipt-123',
    });
    } finally {
    await consumer.onApplicationShutdown();
    }
  });

  it('does not delete an SQS message when processing fails', async () => {
    const config = {
      getOrThrow: vi.fn((key: string) => {
        const values: Record<string, string> = {
          SCOUTING_QUEUE_URL: 'https://example.com/queue',
          AWS_REGION: 'eu-west-2',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const process = vi.fn().mockRejectedValue(
    new Error('Database unavailable'),
    );

    const reportService = {
    process,
    } as unknown as ScoutingReportService;

    const consumer = new SqsConsumerService(config, reportService);

    const request = {
      reportId: 'report-123',
      playerNo: 42,
      requestedAt: '2026-11-10T12:00:00.000Z',
    };

    const message = {
      MessageId: 'sqs-message-123',
      ReceiptHandle: 'receipt-123',
      Body: JSON.stringify(request),
    };

    let signalSecondPoll!: () => void;

    const secondPollStarted = new Promise<void>((resolve) => {
        signalSecondPoll = resolve;
    });
    
    
    let receiveCount = 0;

    const sendSpy = vi
    .spyOn(SQSClient.prototype, 'send')
    .mockImplementation(async (command, options) => {
        if (command instanceof ReceiveMessageCommand) {
        receiveCount++;

        if (receiveCount === 1) {
            return {
            Messages: [message],
            $metadata: {},
            };
        }

        // The second poll proves that the first
        // processing attempt has finished.
        signalSecondPoll();

        // Hold the poll until the consumer shuts down.
        return new Promise((_, reject) => {
            const signal = options?.abortSignal;

            if (signal?.aborted) {
            reject(new Error('Polling aborted'));
            return;
            }

            signal?.addEventListener(
            'abort',
            () => reject(new Error('Polling aborted')),
            { once: true },
            );
        });
        }

        if (command instanceof DeleteMessageCommand) {
        return { $metadata: {} };
        }

        throw new Error('Unexpected SQS command');
    });


    
    consumer.onApplicationBootstrap();

    try {
    await secondPollStarted;

    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(request);

    const deleteCommands = sendSpy.mock.calls
        .map(([command]): unknown => command)
        .filter(
        (command): command is DeleteMessageCommand =>
            command instanceof DeleteMessageCommand,
        );

    expect(deleteCommands).toHaveLength(0);
    } finally {
    await consumer.onApplicationShutdown();
    }

  });  
});
