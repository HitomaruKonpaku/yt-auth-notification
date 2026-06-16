import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelModule } from './channel/channel.module';
import { ConfigModule } from './config/config.module';
import { Channel } from './db/channel.entity';
import { Notification } from './db/notification.entity';
import { DiscordModule } from './discord/discord.module';
import { DisplayModule } from './display/display.module';
import { NotificationModule } from './notification/notification.module';
import { PollingModule } from './polling/polling.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: `${process.env.DATA_DIR || './data'}/database.sqlite`,
      entities: [
        Channel,
        Notification,
      ],
      synchronize: true,
    }),

    ConfigModule,
    PollingModule,

    // youtube
    YoutubeModule,
    ChannelModule,
    NotificationModule,

    // ui
    DisplayModule,

    // external
    DiscordModule,
  ],
})
export class AppModule { }
