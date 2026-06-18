import { Injectable, Logger } from '@nestjs/common';
import { ChannelRepo } from './channel.repo';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(private readonly repo: ChannelRepo) { }

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
