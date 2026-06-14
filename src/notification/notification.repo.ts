import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../db/notification.entity';
import type { PaginationOpts } from '../common/pagination';

@Injectable()
export class NotificationRepo {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) { }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  async insert(row: Partial<Notification>): Promise<void> {
    await this.repo.insert(row);
  }

  async findAll(opts: PaginationOpts): Promise<Notification[]> {
    return this.repo.find({
      order: { sent_at: 'DESC' },
      skip: opts.offset,
      take: opts.limit,
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
