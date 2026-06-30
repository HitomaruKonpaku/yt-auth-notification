import { Injectable, Logger } from '@nestjs/common';
import type Innertube from 'youtubei.js';
import { YTNodes } from 'youtubei.js';
import { ChannelService } from '../channel/channel.service';
import { extractPageId } from '../channel/channel.util';
import { ConfigService } from '../config/config.service';
import { HealthCheckService } from '../healthcheck/healthcheck.service';
import { SseService } from '../sse/sse.service';
import { CookieService } from '../youtube/cookie.service';
import { YTProvider } from '../youtube/yt.provider';
import type { AccountInfo } from './account.interface';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly accountsMap = new Map<string, AccountInfo | null>();

  private initialized = false;

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
    private readonly sseService: SseService,
    private readonly ytProvider: YTProvider,
    private readonly cookieService: CookieService,
    private readonly healthCheckService: HealthCheckService,
  ) {
    this.cookieService.on('changed', () => {
      this.logger.log('Cookie file changed, resetting accounts');
      this.accountsMap.clear();
      this.initialized = false;
    });
  }

  get accounts(): AccountInfo[] {
    return this.getAccounts();
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  getAccounts(): AccountInfo[] {
    const accounts: AccountInfo[] = [];
    for (const info of this.accountsMap.values()) {
      if (!info) {
        continue;
      }
      accounts.push(info);
    }
    return accounts;
  }

  getAccount(channelId: string): AccountInfo {
    const account = this.accountsMap.get(channelId);
    return account as AccountInfo;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const yt = await this.ytProvider.initYt('__main__');

    let channels: YTNodes.AccountItem[];
    try {
      this.logger.debug('yt.account.getInfo(true)');
      const accountInfo = await yt.account.getInfo(true);
      channels = accountInfo ?? [];
    } catch (err) {
      this.logger.error('yt.account.getInfo(true) failed', err);
      return;
    }

    if (channels.length === 0) {
      this.logger.error('No channels found — check your account/cookies');
      this.healthCheckService.markSessionExpired();
      return;
    }

    this.logger.log(`Found ${channels.length} channel(s)`);
    this.healthCheckService.markSessionValid();

    for (const channel of channels) {
      await this.initializeChannel(yt, channel);
    }

    await this.handoffSessions(yt);

    this.initialized = true;
    this.sseService.push('account.list', { items: this.getAccounts() });
  }

  private async initializeChannel(yt: Innertube, channel: YTNodes.AccountItem): Promise<void> {
    const handle = channel.channel_handle?.toString();
    if (!handle) {
      return;
    }

    const maxRetries = this.configService.getConfig().accountInitRetries!;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = `https://www.youtube.com/${handle}`;
        this.logger.debug(`yt.resolveURL(${url})`);
        const resolved = await yt.resolveURL(url);
        const channelId = resolved.payload.browseId as string;
        this.logger.debug(`  -> ${JSON.stringify({ handle, channelId })}`);

        await this.channelService.upsert({ id: channelId, handle, name: channel.account_name?.toString() ?? '', thumbnail_url: channel.account_photo?.[0]?.url ?? undefined });

        this.accountsMap.set(channelId, {
          id: channelId,
          handle,
          name: channel.account_name?.toString() ?? '',
          thumbnail_url: channel.account_photo?.[0]?.url ?? undefined,
          is_selected: channel.is_selected,
          is_disabled: channel.is_disabled,
          pageId: extractPageId(channel),
        });
        return;
      } catch (err) {
        this.logger.warn(`Account init attempt ${attempt + 1}/${maxRetries} failed for ${handle}`, err);
        if (attempt === maxRetries - 1) {
          this.logger.error(`Skipping channel ${handle} after ${maxRetries} failed attempts`);
        }
      }
    }
  }

  private async handoffSessions(yt: Innertube): Promise<void> {
    for (const [channelId, account] of this.accountsMap) {
      if (!account) {
        continue;
      }
      if (account.is_selected) {
        this.ytProvider.setYt(channelId, yt);
        continue;
      }
      await this.ytProvider.initYt(channelId, account.pageId);
    }
  }
}
