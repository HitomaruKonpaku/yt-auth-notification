import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../db/notification.entity';
import type { PaginationOpts } from '../common/pagination';

@Injectable()
export class NotificationRepo {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) { }

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

  async findAll(opts: PaginationOpts & { channelId?: string }): Promise<Notification[]> {
    const where: any = {};
    if (opts.channelId) {
      where.owner_id = opts.channelId;
    }
    return this.repo.find({
      where,
      order: { sent_at: 'DESC' },
      skip: opts.offset,
      take: opts.limit,
    });
  }

  async count(channelId?: string): Promise<number> {
    const where: any = {};
    if (channelId) {
      where.owner_id = channelId;
    }
    return this.repo.count({ where });
  }
}
