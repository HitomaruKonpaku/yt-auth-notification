import { Injectable, Logger } from '@nestjs/common';
import Innertube, { YT, YTNodes } from 'youtubei.js';
import { AccountService } from '../account/account.service';
import { ConfigService } from '../config/config.service';
import { DiscordService } from '../discord/discord.service';
import { parseBrowseItems, parseRawNotification } from '../notification/notification-parser';
import type { NotificationLike, RawNotification } from '../notification/notification.interface';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { YTProvider } from '../youtube/yt.provider';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);

  private isFirstPoll = true;
  private timer: NodeJS.Timeout | null = null;

  private readonly _debug = {
    canStartPolling: true,
    canGetNotifications: true,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly ytProvider: YTProvider,
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
    private readonly postService: PostService,
    private readonly discordService: DiscordService,
  ) { }

  startPolling() {
    if (!this._debug.canStartPolling) {
      return;
    }

    this.logger.log('Starting polling loop');
    this.poll();
  }

  private scheduleNext() {
    this.timer = setTimeout(() => this.poll(), this.configService.getConfig().interval! * 1000);
  }

  private async poll() {
    try {
      await this.accountService.initialize();

      for (const account of this.accountService.accounts) {
        // await this.pollChannel(account.id);
        await this.pollChannelNew(account.id);
      }

      if (this.configService.getConfig().fetchPost) {
        this.postService.pollPosts();
      }

      this.isFirstPoll = false;
    } catch (err) {
      this.logger.error('Poll loop failed', err);
    }

    this.scheduleNext();
  }

  private async pollChannel(channelId: string) {
    try {
      const account = this.accountService.getAccount(channelId);
      if (!account) {
        this.logger.warn(`Account info not found for ${channelId}, skipping`);
        return;
      }

      const yt = await this.ytProvider.initYt(channelId, account.pageId);
      if (!this._debug.canGetNotifications) {
        return;
      }

      this.logger.debug(`[${channelId}] yt.getNotifications()`);
      const menu: YT.NotificationsMenu = await yt.getNotifications();
      this.logger.debug(`[${channelId}] -> ${menu.contents.length} items`);

      const contents: YTNodes.Notification[] = [...menu.contents];

      // First-poll continuation per account
      if (this.isFirstPoll) {
        const next = parseInt(process.env.NOTIFICATION_NEXT ?? '0', 10) || 0;
        if (next !== 0) {
          let page = menu;
          let i = 0;
          do {
            try {
              page = await page.getContinuation();
              contents.push(...page.contents);
            } catch (err) {
              this.logger.warn(`[${channelId}] Continuation failed`, err);
              break;
            }
            i++;
          } while (next < 0 ? page.contents.length > 0 : i < next);
        }
      }

      this.logger.log(`[${channelId}] Total: ${contents.length} notification(s)`);

      const newItems = await this.notificationService.processNotifications(contents, channelId);
      this.broadcastNewItems(newItems);
    } catch (err) {
      this.logger.error(`[${channelId}] Poll failed`, err);
    }
  }

  private async pollChannelNew(channelId: string) {
    try {
      const account = this.accountService.getAccount(channelId);
      if (!account) {
        this.logger.warn(`Account info not found for ${channelId}, skipping`);
        return;
      }

      const yt = await this.ytProvider.initYt(channelId, account.pageId);
      if (!this._debug.canGetNotifications) {
        return;
      }

      const items = await this.fetchNotifications(channelId, yt);
      this.logger.log(`[${channelId}] Total: ${items.length} notification(s)`);

      const newItems = await this.notificationService.processRawNotifications(items, channelId);
      await this.broadcastNewItems(newItems);
    } catch (err) {
      this.logger.error(`[${channelId}] Poll failed`, err);
    }
  }

  private async fetchNotifications(ownerId: string, yt: Innertube): Promise<RawNotification[]> {
    const items: RawNotification[] = [];

    let data = await this.getNotifications(yt);
    items.push(...data.notifications);

    if (!this.isFirstPoll) {
      return items;
    }

    const next = parseInt(process.env.NOTIFICATION_NEXT ?? '0', 10) || 0;
    if (next === 0) {
      return items;
    }

    let page = 0;
    while (data.continuation && (next < 0 || page < next)) {
      try {
        data = await this.getNotifications(yt, data.continuation);
      } catch (err) {
        this.logger.warn(`[${ownerId}] Continuation failed`, err);
        break;
      }

      page++;
      if (data.notifications.length === 0) {
        break;
      }

      items.push(...data.notifications);
    }

    return items;
  }

  private async getNotifications(
    yt: Innertube,
    continuation?: string,
  ): Promise<{ notifications: RawNotification[]; continuation?: string }> {
    const browseId = 'FEnotifications_inbox';
    const context = JSON.parse(JSON.stringify(yt.session.context));
    const body: Record<string, unknown> = { context };
    if (continuation) {
      body.continuation = continuation;
    } else {
      body.browseId = browseId;
    }

    const { data } = await yt.actions.execute('browse', body);
    const rawItems = parseBrowseItems(data);

    const notifications: RawNotification[] = [];
    let newContinuation: string | undefined;

    for (const item of rawItems) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      if ('notificationRenderer' in item) {
        notifications.push(parseRawNotification(item.notificationRenderer));
      }
      if ('continuationItemRenderer' in item) {
        newContinuation = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      }
    }

    return { notifications, continuation: newContinuation };
  }

  private async broadcastNewItems(items: NotificationLike[]) {
    for (const item of items) {
      await this.discordService.relayNotification(item);
    }
  }
}
