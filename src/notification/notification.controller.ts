import { Controller, Get, Query } from '@nestjs/common';
import { ParseNumberPipe } from '../common/parse-number.pipe';
import { NotificationService } from './notification.service';
import { enrichNotification } from './notification.util';

@Controller('api')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get('notifications')
  async getNotifications(
    @Query('limit', new ParseNumberPipe(50)) limit: number,
    @Query('offset', new ParseNumberPipe(0)) offset: number,
    @Query('channel_id') channelId?: string,
  ) {
    const result = await this.notificationService.getNotifications(limit, offset, channelId);
    return {
      total: result.total,
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
