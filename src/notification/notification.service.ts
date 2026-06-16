import { Injectable, Logger } from '@nestjs/common';
import { YTNodes } from 'youtubei.js';
import { NotificationRepo } from './notification.repo';
import type { NotificationLike } from '../discord/discord.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly repo: NotificationRepo) { }

  async processNotifications(raw: YTNodes.Notification[], ownerId: string | null) {
    const rows: NotificationLike[] = raw.map(n => ({
      id: n.notification_id,
      created_at: Date.now(),
      sent_at: Math.trunc(Number(n.notification_id) / 1000),
      owner_id: ownerId,
      video_id: n.endpoint.payload?.videoId,
      linked_comment_id: n.endpoint.payload?.linkedCommentId,
      endpoint_url: n.endpoint.metadata.url,
      short_message: { text: n.short_message.text ?? '', rtl: n.short_message.rtl },
      thumbnail_url: n.thumbnails[0]?.url,
    }));

    const insertedIds = await this.repo.upsertAll(rows);
    const newItems = rows.filter(r => insertedIds.includes(r.id));

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
