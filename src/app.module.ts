import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './db/notification.entity';
import { ConfigModule } from './config/config.module';
import { DiscordModule } from './discord/discord.module';
import { DisplayModule } from './display/display.module';
import { NotificationModule } from './notification/notification.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: `${process.env.DATA_DIR || './data'}/database.sqlite`,
      entities: [Notification],
      synchronize: true,
    }),
    ConfigModule,
    DiscordModule,
    DisplayModule,
    NotificationModule,
    YoutubeModule,
  ],
})
export class AppModule { }
