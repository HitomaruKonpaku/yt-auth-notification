import { Injectable, Logger } from '@nestjs/common';
import type Innertube from 'youtubei.js';
import { YTNodes } from 'youtubei.js';
import { ChannelService } from '../channel/channel.service';
import { ConfigService } from '../config/config.service';
import type { AccountInfo } from './account.interface';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly accountsMap = new Map<string, AccountInfo | null>();
  private initialized = false;

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
  ) { }

  async initialize(yt: Innertube): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.debug('yt.account.getInfo(true)');
      const accountInfo = await yt.account.getInfo(true);
      const channels = accountInfo ?? [];
      this.logger.log(`Found ${channels.length} channel(s)`);

      // Collect metadata keyed by handle first
      const metaByHandle = new Map<string, { name: string; thumbnail_url?: string; isSelected: boolean; pageId?: string }>();
      for (const ch of channels) {
        const handle = ch.channel_handle?.toString();
        if (!handle) {
          continue;
        }
        metaByHandle.set(handle, {
          name: ch.account_name?.toString() ?? '',
          thumbnail_url: ch.account_photo?.[0]?.url ?? undefined,
          isSelected: ch.is_selected ?? true,
          pageId: !ch.is_selected ? this.extractPageId(ch) : undefined,
        });
      }

      const maxRetries = this.configService.getConfig().accountInitRetries!;
      for (const [handle, meta] of metaByHandle) {
        this.accountsMap.set(handle, null); // lock insertion order
        let channelId: string | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            // Resolve real channel ID from handle
            const url = `https://www.youtube.com/${handle}`;
            this.logger.debug(`yt.resolveURL(${url})`);
            const resolved = await yt.resolveURL(url);
            channelId = resolved.payload.browseId as string;
            this.logger.debug(`  -> ${JSON.stringify({ handle, channelId })}`);

            // Re-key from handle to real channel ID
            this.accountsMap.delete(handle);
            this.accountsMap.set(channelId, {
              handle,
              name: meta.name,
              thumbnail_url: meta.thumbnail_url,
              pageId: meta.pageId,
            });

            await this.channelService.upsert(channelId, handle, meta.name, meta.thumbnail_url);
            break;
          } catch (err) {
            this.logger.warn(`Account init attempt ${attempt + 1}/${maxRetries} failed for ${handle}`, err);
            if (attempt === maxRetries - 1) {
              this.logger.error(`Skipping channel ${handle} after ${maxRetries} failed attempts`);
              this.accountsMap.delete(channelId ?? handle);
            }
          }
        }
      }

      this.initialized = true;
    } catch (err) {
      this.logger.error('AccountService.initialize() failed', err);
      // Retry next poll
    }
  }

  get(channelId: string): AccountInfo | undefined {
    const entry = this.accountsMap.get(channelId);
    return entry ?? undefined;
  }

  get accounts(): IterableIterator<[string, AccountInfo]> {
    const entries: [string, AccountInfo][] = [];
    for (const [id, info] of this.accountsMap) {
      if (info !== null) {
        entries.push([id, info]);
      }
    }
    return entries[Symbol.iterator]();
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  private extractPageId(ch: YTNodes.AccountItem): string | undefined {
    const tokens = ch.endpoint?.payload?.supportedTokens ;
    if (!Array.isArray(tokens)) {
      return undefined;
    }
    for (const token of tokens) {
      if (token?.pageIdToken?.pageId) {
        return String(token.pageIdToken.pageId);
      }
    }
    return undefined;
  }
}
