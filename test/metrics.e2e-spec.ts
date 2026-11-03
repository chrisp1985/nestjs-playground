import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('HTTP Metrics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('records successful HTTP requests', async () => {
    await request(app.getHttpServer())
      .get('/players')
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);

    expect(response.text).toContain(
      'http_request_duration_seconds_count',
    );

    expect(response.text).toContain(
      'status_code="200"',
    );
  });

  it('records unsuccessful HTTP requests', async () => {
    await request(app.getHttpServer())
      .get('/players/99999999')
      .expect(404);

    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);

    expect(response.text).toContain(
      'http_request_duration_seconds_count',
    );

    expect(response.text).toContain(
      'status_code="404"',
    );
  });  
});