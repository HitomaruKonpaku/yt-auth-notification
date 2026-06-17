import { Injectable, Logger } from '@nestjs/common';
import { YTNodes } from 'youtubei.js';
import { decodePostParams } from '../common/params-parser';
import type { NotificationLike } from '../discord/discord.interface';
import { PostRepo } from '../post/post.repo';
import { NotificationRepo } from './notification.repo';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly repo: NotificationRepo,
    private readonly postRepo: PostRepo,
  ) { }

  async processNotifications(raw: YTNodes.Notification[], ownerId?: string) {
    const rows: NotificationLike[] = [];
    for (const n of raw) {
      const row: NotificationLike = {
        id: n.notification_id,
        created_at: Date.now(),
        sent_at: Math.trunc(Number(n.notification_id) / 1000),
        owner_id: ownerId,
        video_id: n.endpoint.payload?.videoId,
        linked_comment_id: n.endpoint.payload?.linkedCommentId,
        post_id: undefined,
        endpoint_url: n.endpoint.metadata.url,
        short_message: { text: n.short_message.text ?? '', rtl: n.short_message.rtl },
        thumbnail_url: n.thumbnails[0]?.url,
      };

      await this.tryParsePost(n, row);

      rows.push(row);
    }

    const insertedIds = await this.repo.upsertAll(rows as Parameters<NotificationRepo['upsertAll']>[0]);
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

  private async tryParsePost(n: YTNodes.Notification, row: NotificationLike) {
    if (n.endpoint.payload?.browseId !== 'FEpost_detail' || !n.endpoint.payload?.params) {
      return;
    }

    const params = n.endpoint.payload.params;
    const parsed = decodePostParams(params);
    if (!parsed) {
      this.logger.warn(`tryParsePost: failed to decode ${JSON.stringify({ params })}`);
      return;
    }

    this.logger.debug(`tryParsePost: ${JSON.stringify({
      params,
      post_id: parsed.post_id,
      channel_id: parsed.channel_id,
    })}`);

    row.post_id = parsed.post_id;

    try {
      await this.postRepo.upsert({
        post_id: parsed.post_id,
        channel_id: parsed.channel_id,
        created_at: row.sent_at,
      });
    } catch (err) {
      this.logger.warn('Failed to upsert post', err);
    }
  }
}
