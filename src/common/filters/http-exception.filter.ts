
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();

    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = extractMessage(exception);
    const requestId = randomUUID();

    // Log unexpected errors without exposing them to clients.
    if (!(exception instanceof HttpException)) {
      if (exception instanceof Error) {
        this.logger.error(
          `Unhandled exception. requestId=${requestId}`,
          exception.stack,
        );
      } else {
        this.logger.error(
          `Unhandled non-Error exception. requestId=${requestId}`,
        );
      }
    }

    // Preserve the sanitised Terminus readiness contract.
    if (
      request.path === '/health/ready' &&
      exception instanceof HttpException &&
      status === HttpStatus.SERVICE_UNAVAILABLE
    ) {
      const healthResponse = exception.getResponse();

      if (isRecord(healthResponse)) {
        const detailsStatus = getDatabaseStatus(
          healthResponse['details'],
        );

        const errorStatus = getDatabaseStatus(
          healthResponse['error'],
        );

        if (
          healthResponse['status'] === 'error' &&
          detailsStatus === 'down' &&
          errorStatus === 'down'
        ) {
          response.status(status).json({
            status: 'error',
            info: {},
            error: {
              database: { status: errorStatus },
            },
            details: {
              database: { status: detailsStatus },
            },
          });

          return;
        }
      }
    }

    // Standard API error response.
    const error = STATUS_CODES[status] ?? 'Error';

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.path,
      requestId,
    });
  }
}

/**
 * Extract a safe message from recognised NestJS HTTP exceptions.
 * Unexpected exceptions never expose their internal messages.
 */
function extractMessage(
  exception: unknown,
): string | string[] {
  if (!(exception instanceof HttpException)) {
    return 'Internal server error';
  }

  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (isRecord(response)) {
    const message = response['message'];

    if (typeof message === 'string') {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every(
        (item): item is string => typeof item === 'string',
      )
    ) {
      return message;
    }
  }

  return 'Request failed';
}

/**
 * Narrow unknown values into indexable objects.
 */
function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Safely extract the database status without exposing
 * additional health indicator properties.
 */
function getDatabaseStatus(
  value: unknown,
): 'up' | 'down' | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const database = value['database'];

  if (!isRecord(database)) {
    return undefined;
  }

  const status = database['status'];

  if (status === 'up' || status === 'down') {
    return status;
  }

  return undefined;
}
