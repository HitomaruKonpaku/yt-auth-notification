import { Injectable, Logger } from '@nestjs/common';
import { YT, YTNodes } from 'youtubei.js';
import { ConfigService } from '../config/config.service';
import { DiscordService } from '../discord/discord.service';
import { NotificationService } from './notification.service';
import { YTProvider } from '../youtube/yt.provider';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);

  private static readonly MAX_BACKOFF_MS = 30 * 60 * 1000;

  private isFirstPoll = true;
  private currentWaitMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
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
      const yt = await this.ytProvider.getYt();

      this.logger.debug('yt.getNotifications()');
      const menu: YT.NotificationsMenu = await yt.getNotifications();
      this.logger.debug(`  -> ${menu.contents.length} items`);

      const contents: YTNodes.Notification[] = [...menu.contents];
      let pages = 1;

      // On first poll after boot, fetch continuation pages
      if (this.isFirstPoll) {
        this.isFirstPoll = false;
        const next = parseInt(process.env.NOTIFICATION_NEXT ?? '0', 10) || 0;
        if (next < 0) {
          let page = menu;
          while (page.contents.length > 0) {
            try {
              this.logger.debug(`page.getContinuation() [${pages}]`);
              page = await page.getContinuation();
              this.logger.debug(`  -> ${page.contents.length} items`);
              contents.push(...page.contents);
              pages++;
            } catch {
              break;
            }
          }
        } else if (next > 0) {
          let page = menu;
          for (let i = 0; i < next; i++) {
            try {
              this.logger.debug(`page.getContinuation() [${i + 1}]`);
              page = await page.getContinuation();
              this.logger.debug(`  -> ${page.contents.length} items`);
              contents.push(...page.contents);
              pages++;
            } catch {
              break;
            }
          }
        }
      }

      this.logger.log(`Total: ${contents.length} notifications (${pages} page(s))`);

      const newItems = await this.notificationService.processNotifications(contents);

      for (const item of newItems) {
        await this.discordService.relayNotification(item);
      }

      this.currentWaitMs = this.getIntervalMs();
    } catch (err) {
      this.logger.error('Innertube poll failed', err);
      this.currentWaitMs = Math.min(this.currentWaitMs * 2, PollingService.MAX_BACKOFF_MS);
      this.logger.warn(`Backing off: next poll in ${this.currentWaitMs / 1000}s`);
    }

    this.scheduleNext();
  }
}
