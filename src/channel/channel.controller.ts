import { Controller, Get, Query } from '@nestjs/common';
import { ParseNumberPipe } from '../common/parse-number.pipe';
import { ChannelService } from './channel.service';

@Controller('api')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) { }

  @Get('channels')
  async getChannels(
    @Query('limit', new ParseNumberPipe(50)) limit: number,
    @Query('offset', new ParseNumberPipe(0)) offset: number,
  ) {
    return this.channelService.getChannels(limit, offset);
  }
}
