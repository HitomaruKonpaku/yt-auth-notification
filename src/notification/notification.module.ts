import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../db/notification.entity';
import { NotificationService } from './notification.service';
import { PollingService } from './polling.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { DiscordModule } from '../discord/discord.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    YoutubeModule,
    DiscordModule,
  ],
  providers: [
    NotificationService,
    PollingService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationModule { }
