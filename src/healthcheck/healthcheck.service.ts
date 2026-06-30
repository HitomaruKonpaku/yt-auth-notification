import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AccountService } from '../account/account.service';
import { ConfigService } from '../config/config.service';
import { SseService } from '../sse/sse.service';
import { YTProvider } from '../youtube/yt.provider';

@Injectable()
export class HealthCheckService implements OnModuleInit {
  private readonly logger = new Logger(HealthCheckService.name);

  sessionExpired = false;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    private readonly ytProvider: YTProvider,
    private readonly sseService: SseService,
  ) { }

  getSessionStatus(): { expired: boolean } {
    return { expired: this.sessionExpired };
  }

  markSessionValid(): void {
    this.sessionExpired = false;
  }

  markSessionExpired(): void {
    this.sessionExpired = true;
    this.sseService.push('session.expired', {});
  }

  onModuleInit(): void {
    const intervalMs = this.configService.getConfig().healthCheckIntervalMs!;
    if (intervalMs <= 0) {
      this.logger.log('Health check disabled (interval <= 0)');
      return;
    }

    const interval = setInterval(() => this.tick(), intervalMs);
    this.schedulerRegistry.addInterval('health-check', interval);
    this.logger.log(`Health check started with interval ${intervalMs}ms`);
  }

  // ponytail: public for testability — setInterval callback extracts poorly from Node timers
  async tick(): Promise<void> {
    const account = this.accountService.getAccounts().find(a => a.is_selected);
    if (!account) {
      this.logger.debug('Health check: no selected account, skipping');
      return;
    }

    const yt = this.ytProvider.getYt(account.id);
    if (!yt) {
      this.logger.debug('Health check: no cached session for selected account, skipping');
      return;
    }

    try {
      await yt.account.getInfo();
      this.sessionExpired = false;
      this.logger.debug('Health check: session OK');
    } catch (err) {
      const e = err as { version?: unknown; message?: unknown } | undefined;
      if (e?.version && e?.message === 'Page contents not found') {
        this.markSessionExpired();
        this.logger.warn('Health check: cookie expired');
      } else {
        this.logger.warn('Health check: getInfo failed with unexpected error', err);
      }
    }
  }
}
