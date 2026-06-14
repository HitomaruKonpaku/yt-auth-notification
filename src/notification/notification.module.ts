import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../db/notification.entity';
import { DiscordModule } from '../discord/discord.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { NotificationRepo } from './notification.repo';
import { NotificationService } from './notification.service';
import { PollingService } from './polling.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    YoutubeModule,
    DiscordModule,
  ],
  providers: [
    NotificationRepo,
    NotificationService,
    PollingService,
  ],
  exports: [
    NotificationRepo,
    NotificationService,
  ],
})
export class NotificationModule { }
