import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../src/db/notification.entity';
import { YTProvider } from '../src/youtube/yt.provider';
import { CookieService } from '../src/youtube/cookie.service';
import { ConfigService } from '../src/config/config.service';
import { HealthCheckService } from '../src/healthcheck/healthcheck.service';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Notification],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        getConfig: () => ({
          interval: 60,
          webhooks: { discord: [] },
        }),
      })
      .overrideProvider(YTProvider)
      .useValue({
        getYt: async () => ({ getNotifications: async () => ({ contents: [] }) }),
      })
      .overrideProvider(CookieService)
      .useValue({
        getCookieString: () => 'mock=cookie',
        on: () => {},
        off: () => {},
      })
      .overrideProvider(HealthCheckService)
      .useValue({
        sessionExpired: false,
        markSessionValid: () => {},
        markSessionExpired: () => {},
        tick: async () => {},
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/notifications returns empty items on fresh DB', () => {
    return request(app.getHttpServer())
      .get('/api/notifications')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('total', 0);
        expect(res.body).toHaveProperty('items');
        expect(res.body.items).toEqual([]);
      });
  });
});
