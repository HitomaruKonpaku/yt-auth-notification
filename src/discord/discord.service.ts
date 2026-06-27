import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { AccountService } from '../account/account.service';
import { ChannelService } from '../channel/channel.service';
import { parseAuthorName } from '../common/author-parser';
import { buildYtEndpointUrl, buildYtVideoThumbnailUrl } from '../common/link-builder';
import type { DiscordWebhookConfig } from '../config/config.interface';
import { ConfigService } from '../config/config.service';
import type { NotificationLike } from '../notification/notification.interface';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly limiter = new Bottleneck({ maxConcurrent: 1 });

  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    private readonly channelService: ChannelService,
  ) { }

  async relayNotification(notif: NotificationLike) {
    const webhooks = this.configService.getConfig().webhooks!.discord!;
    const embed = await this.buildEmbed(notif);
    await Promise.all(webhooks.map((w) => this.limiter.schedule(() => this.sendToWebhook(w, embed, notif.id))));
  }

  private async sendToWebhook(
    webhook: DiscordWebhookConfig,
    embed: Record<string, any>,
    notifId: string,
  ) {
    try {
      const body: Record<string, any> = { embeds: [embed] };
      if (webhook.msg && webhook.msg.length > 0) {
        body.content = webhook.msg;
      }

      await axios.post(webhook.url!, body);
      this.logger.log(`Sent notification #${notifId} to webhook`);
    } catch (err) {
      this.logger.warn(`Webhook failed: ${(err as Error).message}`);
    }
  }

  private async buildEmbed(notif: NotificationLike) {
    const shortMsg = notif.short_message;
    const text: string = shortMsg.text || '';
    const authorName = parseAuthorName(text);

    const embed: Record<string, any> = {
      author: { name: authorName },
      color: 0xff0000,
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

    if (notif.owner_id) {
      const footer = await this.buildFooter(notif.owner_id);
      if (footer) {
        embed.footer = footer;
      }
    }

    return embed;
  }

  private async buildFooter(ownerId: string): Promise<Record<string, any> | null> {
    try {
      let handle: string | undefined;
      let iconUrl: string | undefined;

      const account = this.accountService.get(ownerId);
      if (account) {
        handle = account.handle;
        iconUrl = account.thumbnail_url;
      } else {
        const channel = await this.channelService.findById(ownerId);
        if (channel) {
          handle = channel.handle;
          iconUrl = channel.thumbnail_url;
        }
      }

      if (!handle) {
        return null;
      }

      const footer: Record<string, any> = { text: handle };
      if (iconUrl) {
        footer.icon_url = iconUrl;
      }

      return footer;
    } catch {
      return null;
    }
  }
}
