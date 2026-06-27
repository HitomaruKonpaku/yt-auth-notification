import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import type { PaginatedResult, PaginationOpts } from '../common/pagination';
import { Notification } from '../db/notification.entity';

@Injectable()
export class NotificationRepo {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) { }

  async findAll(opts: PaginationOpts & { channelId?: string }): Promise<PaginatedResult<Notification>> {
    const where: FindOptionsWhere<Notification> = {};
    if (opts.channelId) {
      where.owner_id = opts.channelId;
    }
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { sent_at: 'DESC' },
      skip: opts.offset,
      take: opts.limit,
    });
    return { total, items };
  }

  async findExistingIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }
    const rows = await this.repo.find({ select: { id: true }, where: { id: In(ids) } });
    return new Set(rows.map(r => r.id));
  }

  async upsertAll(rows: Partial<Notification>[]): Promise<string[]> {
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map(r => r.id!);
    const existingIds = await this.findExistingIds(ids);

    await this.repo.upsert(rows, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    });

    return ids.filter(id => !existingIds.has(id));
  }
}
