import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: MetricsService,
  ) {}

  intercept(
  context: ExecutionContext,
  next: CallHandler,
): Observable<unknown> {
  const request = context
    .switchToHttp()
    .getRequest<Request>();

  const response = context
    .switchToHttp()
    .getResponse<Response>();

  const start = process.hrtime.bigint();

  const route =
    request.route?.path ?? 'unknown';

  response.once('finish', () => {
    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    this.metrics.httpDuration.observe(
      {
        method: request.method,
        route,
        status_code: response.statusCode,
      },
      duration,
    );
  });

  return next.handle();
}
}