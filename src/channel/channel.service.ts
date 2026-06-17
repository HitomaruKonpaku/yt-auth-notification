import { Injectable, Logger } from '@nestjs/common';
import type Innertube from 'youtubei.js';
import { ChannelRepo } from './channel.repo';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  private static readonly MAX_RETRIES = 3;

  private ownerId?: string;
  private retries = 0;

  constructor(private readonly repo: ChannelRepo) { }

  async ensureChannel(yt: Innertube): Promise<string | undefined> {
    if (this.ownerId && await this.repo.exists(this.ownerId)) {
      return this.ownerId;
    }

    if (!this.ownerId) {
      this.retries = 0;
    }

    if (this.retries >= ChannelService.MAX_RETRIES) {
      return this.ownerId;
    }

    try {
      this.logger.debug('yt.account.getInfo()');
      const accountInfo = await yt.account.getInfo();
      const handle = (accountInfo.contents?.contents?.[0] as any)?.channel_handle?.toString();
      const name = (accountInfo.contents?.contents?.[0] as any)?.account_name?.toString();
      this.logger.debug(`  -> ${JSON.stringify({ handle, name })}`);

      const url = `https://www.youtube.com/${handle}`;
      this.logger.debug('yt.resolveURL()');
      const resolvedChannel = await yt.resolveURL(url);
      const channelId = resolvedChannel.payload.browseId as string;
      this.logger.debug(`  -> ${JSON.stringify({ id: channelId })}`);

      await this.repo.upsert({ id: channelId, handle, name });
      this.ownerId = channelId;
      this.retries = 0;
      return channelId;
    } catch (err) {
      this.logger.error('Failed to resolve channel info', err);
      this.retries++;
      return this.ownerId;
    }
  }
}
