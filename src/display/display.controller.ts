import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { DateTime } from 'luxon';
import { join } from 'path';
import { buildYtEndpointUrl } from '../common/link-builder';
import { NotificationService } from '../notification/notification.service';

@Controller()
export class DisplayController {
  private indexHtml: string;

  constructor(private readonly notificationService: NotificationService) {
    this.indexHtml = readFileSync(join(__dirname, 'views', 'index.hbs'), 'utf8');
  }

  @Get()
  index(@Res() res: Response) {
    res.type('html').send(this.indexHtml);
  }

  @Get('api/notifications/latest')
  async getLatest() {
    const result = await this.notificationService.getNotifications(1, 0);
    const item = result.items[0] || null;
    if (item) {
      (item as any)._linkUrl = buildYtEndpointUrl(item);
    }
    return { item };
  }

  @Get('api/notifications')
  async getNotifications(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const result = await this.notificationService.getNotifications(+limit, +offset);
    return {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      items: result.items.map(item => ({
        ...item,
        short_message: item.short_message,
        _linkUrl: buildYtEndpointUrl(item),
        _sentFormatted: DateTime.fromMillis(item.sent_at).toRelative(),
        _sentAbsolute: DateTime.fromMillis(item.sent_at).toFormat('yyyy-MM-dd HH:mm:ss'),
      })),
    };
  }
}
