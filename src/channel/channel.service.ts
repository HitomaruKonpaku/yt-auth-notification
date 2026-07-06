import { Injectable, Logger } from '@nestjs/common';
import type Innertube from 'youtubei.js';
import { Channel } from '../db/channel.entity';
import { ChannelRepo } from './channel.repo';
import { extractHandle } from './channel.util';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(private readonly repo: ChannelRepo) { }

  async getChannels(limit: number, offset: number) {
    return this.repo.findAll({ limit, offset });
  }

  async findById(id: string): Promise<Channel | null> {
    return this.repo.findById(id);
  }

  async upsert(data: Partial<Channel>): Promise<void> {
    try {
      await this.repo.upsert(data);
    } catch (err) {
      this.logger.error(`Channel upsert failed for ${data.id}`, err);
    }
  }

  async fetchChannel(yt: Innertube, channelId: string) {
    const channel = await yt.getChannel(channelId);
    const metadata = channel.metadata;
    if (metadata) {
      await this.upsert({
        id: channelId,
        handle: extractHandle(metadata.vanity_channel_url),
        name: metadata.title,
        thumbnail_url: metadata.thumbnail?.[0]?.url,
      });
    }
    return channel;
  }
}
