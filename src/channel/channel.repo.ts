import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedResult, PaginationOpts } from '../common/pagination';
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

  async findAll(opts: PaginationOpts): Promise<PaginatedResult<Channel>> {
    const [items, total] = await this.repo.findAndCount({
      order: { handle: 'ASC' },
      skip: opts.offset,
      take: opts.limit,
    });
    return { total, items };
  }

  async findById(id: string): Promise<Channel | null> {
    return this.repo.findOne({ where: { id } });
  }

  async upsert(channel: Partial<Channel>): Promise<void> {
    await this.repo.upsert(channel, { conflictPaths: ['id'] });
  }
}
