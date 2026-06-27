import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../db/channel.entity';
import { ChannelRepo } from './channel.repo';

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

  async upsert(
    id: string,
    handle: string,
    name: string,
    thumbnail_url?: string,
  ): Promise<void> {
    try {
      await this.repo.upsert({ id, handle, name, thumbnail_url });
    } catch (err) {
      this.logger.error(`Channel upsert failed for ${id}`, err);
    }
  }
}
