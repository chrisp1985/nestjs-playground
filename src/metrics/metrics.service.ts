import { Injectable } from '@nestjs/common';
import {
  Registry,
  Histogram,
  collectDefaultMetrics,
  Counter
} from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [
      0.01, 0.025, 0.05, 0.1,
      0.25, 0.5, 1, 2.5, 5,
    ],
    registers: [this.registry],
  });

  readonly playersCreated = new Counter({
    name: 'players_created_total',
    help: 'Total successfully created players',
    registers: [this.registry],
  });

  readonly playersDeleted = new Counter({
    name: 'players_deleted_total',
    help: 'Total successfully deleted players',
    registers: [this.registry],
  });  

  constructor() {
    collectDefaultMetrics({
      register: this.registry,
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}