import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same config as main.ts
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/services (POST)', () => {
    it('should create a service with valid data', () => {
      return request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'E2E Test API',
          baseUrl: 'https://api.e2etest.com',
          description: 'Test service for e2e testing',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E Test API');
          expect(res.body.baseUrl).toBe('https://api.e2etest.com');
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Test',
          // missing baseUrl
        })
        .expect(400);
    });
  });

  describe('/services (GET)', () => {
    it('should return list of services', () => {
      return request(app.getHttpServer())
        .get('/services')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
