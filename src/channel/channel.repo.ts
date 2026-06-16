import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../db/channel.entity';

@Injectable()
export class ChannelRepo {
  constructor(
    @InjectRepository(Channel)
    private readonly repo: Repository<Channel>,
  ) { }

  async upsert(channel: Partial<Channel>): Promise<void> {
    await this.repo.upsert(channel, { conflictPaths: ['id'] });
  }

  async exists(id: string): Promise<boolean> {
    return this.repo.exists({ where: { id } });
  }
}
