import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  // Readiness: 200 only when the database answers, 503 otherwise, so
  // Kubernetes stops routing traffic to a pod that can't serve requests.
  // Liveness stays on /status, which doesn't touch the database: a DB outage
  // shouldn't make Kubernetes restart every pod.
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check: pings the database' })
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database').withTimeout(1500),
    ]);
  }
}
