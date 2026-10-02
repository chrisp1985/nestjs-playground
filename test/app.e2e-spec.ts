import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/status (GET)', () => {
    return request(app.getHttpServer()).get('/status').expect(200).expect('UP');
  });

  it('/players (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/players')
      .expect(200);

    expect(response.body).toHaveLength(50);
    expect(response.body[0]).toEqual({
      playerNo: 1,
      name: 'Harry Kane',
      age: 32,
      rating: 9.1,
      position: 'FW',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
