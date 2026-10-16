import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const dbResult = { database: { status: 'up' } };
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          // Run the indicators and wrap their results like Terminus does.
          useValue: {
            check: async (indicators: (() => Promise<unknown>)[]) => ({
              status: 'ok',
              details: Object.assign(
                {},
                ...(await Promise.all(indicators.map((fn) => fn()))),
              ),
            }),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: () => ({ withTimeout: () => Promise.resolve(dbResult) }),
          },
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  it('should report the database check', async () => {
    await expect(healthController.ready()).resolves.toEqual({
      status: 'ok',
      details: dbResult,
    });
  });
});
