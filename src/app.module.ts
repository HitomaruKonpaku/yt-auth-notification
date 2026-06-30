import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from './account/account.module';
import { ChannelModule } from './channel/channel.module';
import { ConfigModule } from './config/config.module';
import { Channel } from './db/channel.entity';
import { Notification } from './db/notification.entity';
import { Post } from './db/post.entity';
import { DiscordModule } from './discord/discord.module';
import { DisplayModule } from './display/display.module';
import { HealthCheckModule } from './healthcheck/healthcheck.module';
import { NotificationModule } from './notification/notification.module';
import { PollingModule } from './polling/polling.module';
import { PostModule } from './post/post.module';
import { SseModule } from './sse/sse.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: `${process.env.DATA_DIR || './data'}/database.sqlite`,
      entities: [
        Channel,
        Notification,
        Post,
      ],
      synchronize: true,
    }),

    ConfigModule,
    SseModule,
    PollingModule,

    // account
    AccountModule,

    // youtube
    YoutubeModule,
    ChannelModule,
    PostModule,
    NotificationModule,

    // healthcheck
    HealthCheckModule,

    // ui
    DisplayModule,

    // external
    DiscordModule,
  ],
})
export class AppModule { }
