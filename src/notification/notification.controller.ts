import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/dto/api-paginated-response.decorator';
import type { PaginatedResult } from '../common/pagination';
import { ParseNumberPipe } from '../common/parse-number.pipe';
import {
  LatestNotificationDto,
  NotificationDto,
} from './dto/notification.dto';
import { NotificationService } from './notification.service';
import { enrichNotification } from './notification.util';

@ApiTags('notifications')
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items to return', example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Items to skip', example: 0 })
  @ApiQuery({ name: 'channel_id', required: false, type: String, description: 'Filter by owner channel ID' })
  @ApiPaginatedResponse(NotificationDto)
  async getNotifications(
    @Query('limit', new ParseNumberPipe(50)) limit: number,
    @Query('offset', new ParseNumberPipe(0)) offset: number,
    @Query('channel_id') channelId?: string,
  ): Promise<PaginatedResult<NotificationDto>> {
    const result = await this.notificationService.getNotifications(limit, offset, channelId);
    return {
      total: result.total,
      items: result.items.map(item => enrichNotification(item)),
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest notification' })
  @ApiOkResponse({ description: 'Most recent notification or null', type: LatestNotificationDto })
  async getLatest(): Promise<LatestNotificationDto> {
    const result = await this.notificationService.getNotifications(1, 0);
    const item = result.items[0] || null;
    return { item: item ? enrichNotification(item) : null };
  }
}
