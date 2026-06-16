import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../db/channel.entity';
import { ChannelRepo } from './channel.repo';
import { ChannelService } from './channel.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
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
