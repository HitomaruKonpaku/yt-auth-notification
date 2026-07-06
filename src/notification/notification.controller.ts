import { Controller, Get, Query } from '@nestjs/common';
import { ParseNumberPipe } from '../common/parse-number.pipe';
import { NotificationService } from './notification.service';
import { enrichNotification } from './notification.util';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
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

  @Get('latest')
  async getLatest() {
    const result = await this.notificationService.getNotifications(1, 0);
    const item = result.items[0] || null;
    return { item: item ? enrichNotification(item) : null };
  }
}
