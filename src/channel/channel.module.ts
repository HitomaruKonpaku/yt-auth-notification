import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../db/channel.entity';
import { ChannelController } from './channel.controller';
import { ChannelRepo } from './channel.repo';
import { ChannelService } from './channel.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
  ],
  controllers: [
    ChannelController,
  ],
  providers: [
    ChannelRepo,
    ChannelService,
  ],
  exports: [
    ChannelRepo,
    ChannelService,
  ],
})
export class ChannelModule { }
