import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { DateTime } from 'luxon';
import { join } from 'path';
import { AppModule } from './app.module';
import { runMigrations } from './db/migrate';
import { PollingService } from './polling/polling.service';

class FmtLogger extends ConsoleLogger {
  protected getTimestamp(): string {
    return DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss.SSS');
  }
}

async function bootstrap() {
  runMigrations();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: new FmtLogger() });
  const logger = new Logger('Bootstrap');

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(__dirname, 'display', 'views'));
  app.setViewEngine('hbs');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('YT Auth Notification')
    .setDescription('YouTube notification polling & community post API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      filter: true,
      persistAuthorization: true,
      defaultModelsExpandDepth: 0,
      tagsSorter: (a: string, b: string) => {
        const order = ['sse', 'healthcheck', 'accounts', 'channels', 'notifications', 'posts'];
        return order.indexOf(a) - order.indexOf(b);
      },
    },
  });

  const host = process.env.HOST || 'localhost';
  const port = Number(process.env.PORT) || 8080;

  await app.listen(port);

  const url = `http://${host}:${port}`;
  logger.warn(`🚀 App running on ${url}`);
  logger.warn(`📖 Swagger UI at ${url}/api/docs`);

  setTimeout(() => {
    const service = app.get(PollingService);
    service.startPolling()
  }, 1000);
}

bootstrap();
