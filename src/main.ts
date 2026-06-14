import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PollingService } from './notification/polling.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(__dirname, 'display', 'views'));
  app.setViewEngine('hbs');

  const host = process.env.HOST || 'localhost';
  const port = Number(process.env.PORT) || 8080;

  await app.listen(port);

  const url = `http://${host}:${port}`;
  logger.warn(`🚀 App running on ${url}`);

  app.get(PollingService).startPolling();
}

bootstrap();
