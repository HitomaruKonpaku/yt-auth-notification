import { Injectable, Logger } from '@nestjs/common';
import { YTNodes } from 'youtubei.js';
import { NotificationRepo } from './notification.repo';
import type { NotificationLike } from '../discord/discord.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly repo: NotificationRepo) { }

  async processNotifications(raw: YTNodes.Notification[]) {
    const ids = raw.map(n => n.notification_id);
    const existingIds = await this.repo.findExistingIds(ids);
    const newItems: NotificationLike[] = [];

    for (const n of raw) {
      const id = n.notification_id;
      if (existingIds.has(id)) {
        continue;
      }

      const now = Date.now();
      const row = {
        id,
        created_at: now,
        sent_at: Math.trunc(Number(id) / 1000),
        video_id: n.endpoint.payload?.videoId,
        linked_comment_id: n.endpoint.payload?.linkedCommentId,
        endpoint_url: n.endpoint.metadata.url,
        short_message: { text: n.short_message.text ?? '', rtl: n.short_message.rtl },
        thumbnail_url: n.thumbnails[0]?.url,
      };

      await this.repo.insert(row);
      newItems.push(row);
    }

    if (newItems.length > 0) {
      this.logger.log(`Inserted ${newItems.length} new notifications`);
    }

    return newItems;
  }

  async getNotifications(limit: number, offset: number) {
    const total = await this.repo.count();
    const items = await this.repo.findAll({ limit, offset });
    return { total, limit, offset, items };
  }
}
