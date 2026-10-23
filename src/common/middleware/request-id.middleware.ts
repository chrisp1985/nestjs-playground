import {
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger(RequestIdMiddleware.name);
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    req.requestId = randomUUID();
    res.setHeader("X-Request-ID", req.requestId);
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // TODO: Log HTTP method, path, final status,
        // duration and request ID.
        this.logger.log(
            `${req.method} ${req.path} ` +
            `status=${res.statusCode} ` +
            `duration=${duration}ms ` +
            `requestId=${req.requestId}`,
        );
    });
    next();
  }
}