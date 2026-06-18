import { Injectable, Logger } from '@nestjs/common';
import { YT, YTNodes } from 'youtubei.js';
import { AccountService } from '../account/account.service';
import { ConfigService } from '../config/config.service';
import { DiscordService } from '../discord/discord.service';
import { NotificationService } from '../notification/notification.service';
import { YTProvider } from '../youtube/yt.provider';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);

  private isFirstPoll = true;
  private currentWaitMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    private readonly ytProvider: YTProvider,
    private readonly notificationService: NotificationService,
    private readonly discordService: DiscordService,
  ) {
    this.currentWaitMs = this.getIntervalMs();
  }

  startPolling() {
    this.logger.log('Starting polling loop');
    this.poll();
  }

  private getIntervalMs(): number {
    return this.configService.getConfig().interval! * 1000;
  }

  private scheduleNext() {
    this.timer = setTimeout(() => this.poll(), this.currentWaitMs);
  }

  private async poll() {
    try {
      // Lazy init: discover accounts on first poll via the active session
      if (!this.accountService.isInitialized) {
        const activeYt = await this.ytProvider.getYt('__active__');
        await this.accountService.initialize(activeYt);
        this.ytProvider.deleteYt('__active__');
      }

      for (const [channelId] of this.accountService.accounts) {
        await this.pollChannel(channelId);
      }

      this.isFirstPoll = false;
      this.currentWaitMs = this.getIntervalMs();
    } catch (err) {
      this.logger.error('Poll loop failed', err);
      this.currentWaitMs = Math.min(
        this.currentWaitMs * 2,
        this.configService.getConfig().maxBackoffMs!,
      );
      this.logger.warn(`Backing off: next poll in ${this.currentWaitMs / 1000}s`);
    }

    this.scheduleNext();
  }

  private async pollChannel(channelId: string) {
    try {
      const account = this.accountService.get(channelId);
      if (!account) {
        this.logger.warn(`Account info not found for ${channelId}, skipping`);
        return;
      }

      const yt = await this.ytProvider.getYt(channelId, account.pageId);

      this.logger.debug(`[${channelId}] yt.getNotifications()`);
      const menu: YT.NotificationsMenu = await yt.getNotifications();
      this.logger.debug(`[${channelId}] -> ${menu.contents.length} items`);

      const contents: YTNodes.Notification[] = [...menu.contents];

      // First-poll continuation per account
      if (this.isFirstPoll) {
        const next = parseInt(process.env.NOTIFICATION_NEXT ?? '0', 10) || 0;
        if (next < 0) {
          let page = menu;
          while (page.contents.length > 0) {
            try {
              page = await page.getContinuation();
              contents.push(...page.contents);
            } catch {
              break;
            }
          }
        } else if (next > 0) {
          let page = menu;
          for (let i = 0; i < next; i++) {
            try {
              page = await page.getContinuation();
              contents.push(...page.contents);
            } catch {
              break;
            }
          }
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
