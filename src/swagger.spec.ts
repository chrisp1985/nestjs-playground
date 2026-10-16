import { INestApplication } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { PlayersController } from './players/players.controller.js';
import { PlayersService } from './players/players.service.js';
import { buildSwaggerDocument } from './swagger.js';

describe('Swagger document', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    // Real controllers, stubbed dependencies: the document is built from
    // decorator metadata, so no database is needed.
    const module = await Test.createTestingModule({
      controllers: [AppController, HealthController, PlayersController],
      providers: [
        AppService,
        { provide: PlayersService, useValue: {} },
        { provide: HealthCheckService, useValue: {} },
        { provide: TypeOrmHealthIndicator, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    document = buildSwaggerDocument(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const schema = (name: string) =>
    document.components?.schemas?.[name] as {
      required?: string[];
      properties: Record<string, Record<string, unknown>>;
    };

  it('documents every route', () => {
    expect(
      Object.fromEntries(
        Object.entries(document.paths).map(([path, item]) => [
          path,
          Object.keys(item).sort(),
        ]),
      ),
    ).toEqual({
      '/status': ['get'],
      '/status/check': ['get'],
      '/health/ready': ['get'],
      '/players': ['get', 'post'],
      '/players/{id}': ['delete', 'get', 'patch'],
    });
  });

  it('describes the list query parameters and paginated response', () => {
    const list = document.paths['/players'].get!;
    const params = Object.fromEntries(
      (
        list.parameters as { name: string; required: boolean; schema: object }[]
      ).map((p) => [p.name, p]),
    );

    expect(Object.keys(params).sort()).toEqual(
      [
        'name',
        'position',
        'club',
        'nationality',
        'minAge',
        'maxAge',
        'minRating',
        'maxRating',
        'sort',
        'page',
        'limit',
      ].sort(),
    );
    expect(Object.values(params).every((p) => !p.required)).toBe(true);
    expect(params.sort.schema).toMatchObject({
      enum: expect.arrayContaining(['rating', '-rating']),
    });
    expect(params.limit.schema).toMatchObject({ maximum: 100, default: 20 });
    expect(list.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PaginatedPlayersDto' },
        },
      },
    });
  });

  it('marks every create field required and every update field optional', () => {
    const fields = ['name', 'age', 'rating', 'position', 'club', 'nationality'];

    expect(schema('CreatePlayerDto').required?.sort()).toEqual(fields.sort());
    expect(schema('CreatePlayerDto').properties.position).toMatchObject({
      enum: ['GK', 'DF', 'MF', 'FW'],
    });
    expect(schema('UpdatePlayerDto').required ?? []).toEqual([]);
    expect(Object.keys(schema('UpdatePlayerDto').properties).sort()).toEqual(
      fields.sort(),
    );
  });

  it('documents the not-found and no-content responses', () => {
    const item = document.paths['/players/{id}'];

    expect(Object.keys(item.get!.responses).sort()).toEqual([
      '200',
      '400',
      '404',
    ]);
    expect(Object.keys(item.delete!.responses).sort()).toEqual([
      '204',
      '400',
      '404',
    ]);
  });
});
