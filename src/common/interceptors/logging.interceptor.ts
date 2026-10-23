import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, finalize, throwError, Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const http = context.switchToHttp();

    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();
    let statusCode = response.statusCode;

    return next.handle().pipe(
        catchError((error: unknown) => {
            statusCode =
                error instanceof HttpException
                ? error.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

            return throwError(() => error);
        }
    ),

    finalize(() => {
        const duration = Date.now() - start;

        this.logger.log(
        `${request.method} ${request.path} ` +
        `status=${statusCode} ` +
        `duration=${duration}ms ` +
        `requestId=${request.requestId}`,
        );
    }),
    );
  }
}