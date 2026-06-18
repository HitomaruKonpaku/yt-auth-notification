import { Controller, Get, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { enrichNotification } from './notification.util';

@Controller('api')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get('notifications')
  async getNotifications(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Query('channel_id') channelId?: string,
  ) {
    const result = await this.notificationService.getNotifications(+limit, +offset, channelId);
    return {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      items: result.items.map(item => enrichNotification(item)),
    };
  }

  @Get('notifications/latest')
  async getLatest() {
    const result = await this.notificationService.getNotifications(1, 0);
    const item = result.items[0] || null;
    return { item: item ? enrichNotification(item) : null };
  }
}
