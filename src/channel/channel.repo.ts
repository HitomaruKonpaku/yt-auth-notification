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

  async exists(id: string): Promise<boolean> {
    return this.repo.exists({ where: { id } });
  }

  async findById(id: string): Promise<Channel | null> {
    return this.repo.findOne({ where: { id } });
  }

  async upsert(channel: Partial<Channel>): Promise<void> {
    await this.repo.upsert(channel, { conflictPaths: ['id'] });
  }
}
