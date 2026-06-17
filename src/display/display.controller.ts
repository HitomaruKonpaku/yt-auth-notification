import { Controller, Get, MessageEvent, Query, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Observable } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { enrichNotification } from '../notification/notification.util';
import { SseService } from '../sse/sse.service';

@Controller()
export class DisplayController {
  private indexHtml: string;

  constructor(
    private readonly sseService: SseService,
    private readonly notificationService: NotificationService,
  ) {
    this.indexHtml = readFileSync(join(__dirname, 'views', 'index.hbs'), 'utf8');
  }

  @Get()
  index(@Res() res: Response) {
    res.type('html').send(this.indexHtml);
  }

  @Sse('/sse')
  stream(): Observable<MessageEvent> {
    return this.sseService.subject.asObservable();
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
      items: result.items.map(item => enrichNotification(item)),
    };
  }

  @Get('api/notifications/latest')
  async getLatest() {
    const result = await this.notificationService.getNotifications(1, 0);
    const item = result.items[0] || null;
    return { item: item ? enrichNotification(item) : null };
  }
}
