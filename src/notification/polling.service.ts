import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { YTProvider } from '../youtube/yt.provider';
import { NotificationService } from './notification.service';
import { DiscordService } from '../discord/discord.service';
import { NotificationRepo } from './notification.repo';
import { YT, YTNodes } from 'youtubei.js';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);
  private currentWait: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ytProvider: YTProvider,
    private readonly notificationService: NotificationService,
    private readonly discordService: DiscordService,
    private readonly repo: NotificationRepo,
  ) {
    this.currentWait = this.configService.getConfig().interval! * 1000;
  }

  startPolling() {
    this.logger.log('Starting polling loop');
    this.poll();
  }

  private scheduleNext() {
    this.timer = setTimeout(() => this.poll(), this.currentWait);
  }

  private async poll() {
    try {
      const yt = await this.ytProvider.getYt();

      this.logger.debug('yt.getNotifications()');
      const menu: YT.NotificationsMenu = await yt.getNotifications();
      this.logger.debug(`  -> ${menu.contents.length} items`);

      const contents: YTNodes.Notification[] = [...menu.contents];

      // Fetch continuation pages based on NOTIFICATION_NEXT env
      const next = Number(process.env.NOTIFICATION_NEXT ?? '0');
      let pages = 1;
      if (next === -1) {
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

      this.logger.log(`Total: ${contents.length} notifications (${pages} page(s))`);

      const isFirstRun = (await this.repo.count()) === 0;

      const newItems = await this.notificationService.processNotifications(contents);

      if (!isFirstRun) {
        for (const item of newItems) {
          await this.discordService.relayNotification(item);
        }
      } else if (newItems.length > 0) {
        this.logger.log(`First run: stored ${newItems.length} notifications without relaying`);
      }

      this.currentWait = this.configService.getConfig().interval! * 1000;
    } catch (err) {
      this.logger.error('Innertube poll failed', err);
      this.currentWait = Math.min(this.currentWait * 2, 30 * 60 * 1000);
      this.logger.warn(`Backing off: next poll in ${this.currentWait / 1000}s`);
    }

    this.scheduleNext();
  }
}
