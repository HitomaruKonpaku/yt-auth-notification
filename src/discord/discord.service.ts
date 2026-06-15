import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { parseAuthorName } from '../common/author-parser';
import { buildYtVideoThumbnailUrl, buildYtEndpointUrl } from '../common/link-builder';
import type { NotificationLike } from './discord.interface';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly configService: ConfigService) { }

  async relayNotification(notif: NotificationLike) {
    const webhooks = this.configService.getConfig().webhooks!.discord!;
    const embed = this.buildEmbed(notif);

    for (const webhook of webhooks) {
      try {
        const body: Record<string, any> = { embeds: [embed] };
        if (webhook.msg && webhook.msg.length > 0) {
          body.content = webhook.msg;
        }

        const res = await fetch(webhook.url!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          this.logger.warn(`Webhook failed: ${res.status} ${res.statusText}`);
        } else {
          this.logger.log(`Sent notification #${notif.id} to webhook`);
        }
      } catch (err) {
        this.logger.warn(`Webhook error: skipping — ${(err as Error).message}`);
      }
    }
  }

  private buildEmbed(notif: NotificationLike) {
    const shortMsg = notif.short_message;
    const text: string = shortMsg.text || '';
    const authorName = parseAuthorName(text);

    const embed: Record<string, any> = {
      author: { name: authorName },
    };

    if (notif.thumbnail_url) {
      embed.author.icon_url = notif.thumbnail_url;
    }

    embed.description = notif.short_message.text;
    const url = buildYtEndpointUrl(notif);
    if (url) {
      embed.description += `\n${url}`;
    }

    embed.timestamp = new Date(notif.sent_at).toISOString();

    if (notif.video_id) {
      embed.thumbnail = { url: buildYtVideoThumbnailUrl(notif.video_id) };
    }

    return embed;
  }
}
