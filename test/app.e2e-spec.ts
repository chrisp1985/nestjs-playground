import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { setupSwagger } from './../src/swagger.js';
import { PlayersService } from '../src/players/players.service.js';
import { HealthCheckService } from '@nestjs/terminus';
import { ServiceUnavailableException } from '@nestjs/common';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  it('/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/status')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'up' });
  });

  describe('/players', () => {
    const kane = {
      playerNo: 1,
      name: 'Harry Kane',
      age: 32,
      rating: 9.1,
      position: 'FW',
      club: 'Bayern Munich',
      nationality: 'England',
    };
    const newPlayer = {
      name: 'Cole Palmer',
      age: 24,
      rating: 8.7,
      position: 'MF',
      club: 'Chelsea',
      nationality: 'England',
    };

    //## Global Error Handling Checks ##

    it('adds a correlation ID to successful requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .expect(200);

      const requestId = response.headers['x-request-id'];
      
      expect(requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('creates a unique request ID for each request', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/players')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/players')
        .expect(200);  
      
      expect(response1.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      expect(response2.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      expect(response2.headers['x-request-id']).not.toBe(response1.headers['x-request-id']);
    });    

    it('returns a consistent error response for missing players', async () => {
        const response = await request(app.getHttpServer())
          .get('/players/99999')
          .expect(404);

        expect(response.body).toMatchObject({
          statusCode: 404,
          error: 'Not Found',
          message: 'Player 99999 not found',
          path: '/players/99999',
          requestId: expect.any(String),
        });

        expect(response.body.requestId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );

        const headerRequestId = response.headers['x-request-id'];
        expect(headerRequestId).toBe(response.body.requestId);
      },
    );

    it('preserves validation error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .query({ sort: 'invalid', limit: 500 })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        path: '/players',
        requestId: expect.any(String),
      });

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.any(String),
        ]),
      );
    });    

    it('does not expose unexpected errors', async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PlayersService)
        .useValue({
          findAll: () => {
            throw new Error('SECRET_DATABASE_PASSWORD');
          },
        })
        .compile();

      const testApp = moduleFixture.createNestApplication();

      try {
        await testApp.init();
        const response = await request(testApp.getHttpServer())
          .get('/players')
          .expect(500);

        expect(response.body).toMatchObject({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Internal server error',
          path: '/players',
          requestId: expect.any(String),
        });

        expect(response.body.requestId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );

        expect(JSON.stringify(response.body)).not.toContain(
          'SECRET_DATABASE_PASSWORD',
        );
      } finally {
        await testApp.close();
      }
    });

    it('returns service unavailable when the status is down.', async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(HealthCheckService)
      .useValue({
        check: () => {
          throw new ServiceUnavailableException({
            status: 'error',
            info: {},
            error: {
              database: { status: 'down' },
            },
            details: {
              database: { status: 'down', internalConnectionString: 'SECRET_DB_HOST' },
            },
          });
        },
      })
      .compile();
      const testApp = moduleFixture.createNestApplication();

      try {
        await testApp.init();
        const response = await request(testApp.getHttpServer())
          .get('/health/ready')
          .expect(503);

        expect(response.body).toMatchObject({
          status: 'error',
          info: {},
          error: {
            database: {
              status: 'down',
            },
          },
          details: {
            database: {
              status: 'down',
            },
          },
        });

        expect(JSON.stringify(response.body)).not.toContain(
          'SECRET_DB_HOST',
        );
        
      } finally {
        await testApp.close();
      }
      
    });

    //## Endpoint Checks ##

    it('GET returns the first page of players', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .expect(200);

      expect(response.body).toMatchObject({ total: 50, page: 1, limit: 20 });
      expect(response.body.data).toHaveLength(20);
      expect(response.body.data[0]).toEqual(kane);
    });

    it('GET filters, sorts and paginates', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .query({ nationality: 'england', sort: '-rating', limit: 2 })
        .expect(200);

      expect(response.body.total).toBe(5);
      expect(response.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Harry Kane',
        'Jude Bellingham',
      ]);
    });

    it('GET rejects invalid query parameters', () => {
      return request(app.getHttpServer())
        .get('/players')
        .query({ sort: 'club', limit: 500 })
        .expect(400);
    });

    it('GET /:id returns one player, or 404', async () => {
      await request(app.getHttpServer())
        .get('/players/1')
        .expect(200)
        .expect(kane);
      await request(app.getHttpServer()).get('/players/99999').expect(404);
      await request(app.getHttpServer()).get('/players/abc').expect(400);
    });

    it('POST, PATCH and DELETE manage a player', async () => {
      const server = app.getHttpServer();

      const created = await request(server)
        .post('/players')
        .send(newPlayer)
        .expect(201);
      const id = created.body.playerNo;
      
      try {
        expect(created.body).toEqual({
          playerNo: expect.any(Number),
          ...newPlayer,
        });

        await request(server)
          .patch(`/players/${id}`)
          .send({ rating: 8.9 })
          .expect(200)
          .expect({ playerNo: id, ...newPlayer, rating: 8.9 });
      } finally {
        await request(server).delete(`/players/${id}`).expect(204);
      }
      await request(server).get(`/players/${id}`).expect(404);
      await request(server).delete(`/players/${id}`).expect(404);
    });

    it('POST rejects invalid or unknown fields', async () => {
      const server = app.getHttpServer();

      await request(server)
        .post('/players')
        .send({ ...newPlayer, rating: 11 })
        .expect(400);
      await request(server)
        .post('/players')
        .send({ ...newPlayer, playerNo: 5 })
        .expect(400);
    });
  });

  it('/api-json serves the OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body.info.title).toBe('nestjs-playground');
    expect(response.body.paths).toHaveProperty('/players/{id}');
  });

  it('/api serves Swagger UI', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.info.database.status).toBe('up');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
