import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../db/notification.entity';
import { NotificationRepo } from './notification.repo';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
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
