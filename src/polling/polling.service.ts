import { Injectable, Logger } from '@nestjs/common';
import { YT, YTNodes } from 'youtubei.js';
import { AccountService } from '../account/account.service';
import { ConfigService } from '../config/config.service';
import { DiscordService } from '../discord/discord.service';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { YTProvider } from '../youtube/yt.provider';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);

  private isFirstPoll = true;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ytProvider: YTProvider,
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
    private readonly postService: PostService,
    private readonly discordService: DiscordService,
  ) { }

  startPolling() {
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
        await this.pollChannel(account.id);
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

      for (const item of newItems) {
        await this.discordService.relayNotification(item);
      }
    } catch (err) {
      this.logger.error(`[${channelId}] Poll failed`, err);
    }
  }
}
