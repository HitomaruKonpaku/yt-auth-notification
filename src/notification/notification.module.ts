import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SseModule } from '../sse/sse.module';
import { Notification } from '../db/notification.entity';
import { NotificationRepo } from './notification.repo';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    SseModule,
  ],
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
