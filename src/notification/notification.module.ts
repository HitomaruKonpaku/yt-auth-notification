import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SseModule } from '../sse/sse.module';
import { Notification } from '../db/notification.entity';
import { NotificationRepo } from './notification.repo';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    SseModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationRepo,
    NotificationService,
  ],
  exports: [
    NotificationRepo,
    NotificationService,
  ],
})
export class NotificationModule { }
