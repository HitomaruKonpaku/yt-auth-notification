import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/dto/api-paginated-response.decorator';
import type { PaginatedResult } from '../common/pagination';
import { ParseNumberPipe } from '../common/parse-number.pipe';
import { ChannelService } from './channel.service';
import { ChannelDto } from './dto/channel.dto';

@ApiTags('channels')
@Controller('api/channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) { }

  @Get()
  @ApiOperation({ summary: 'List known channels' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items to return', example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Items to skip', example: 0 })
  @ApiPaginatedResponse(ChannelDto)
  async getChannels(
    @Query('limit', new ParseNumberPipe(50)) limit: number,
    @Query('offset', new ParseNumberPipe(0)) offset: number,
  ): Promise<PaginatedResult<ChannelDto>> {
    return this.channelService.getChannels(limit, offset);
  }
}
