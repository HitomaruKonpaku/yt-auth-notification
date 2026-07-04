import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Post } from '../db/post.entity';

@Injectable()
export class PostRepo {
  constructor(
    @InjectRepository(Post)
    private readonly repo: Repository<Post>,
  ) { }

  async findById(id: string): Promise<Post | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findToFetch(ids: string[], minAgeMs: number): Promise<Pick<Post, 'id' | 'channel_id' | 'created_at'>[]> {
    if (ids.length === 0) {
      return [];
    }

    const threshold = Date.now() - minAgeMs;
    return this.repo
      .createQueryBuilder('post')
      .select(['post.id', 'post.channel_id', 'post.created_at'])
      .andWhere('post.id IN (:...ids)', { ids })
      .andWhere(
        new Brackets((qb) => {
          qb
            .orWhere('post.fetched_at ISNULL')
            .orWhere('post.fetched_at < :threshold', { threshold });
        }),
      )
      .getMany();
  }

  async upsert(post: Partial<Post>): Promise<void> {
    await this.repo.upsert(post, { conflictPaths: ['id'] });
  }

  async update(id: string, partial: Partial<Post>): Promise<void> {
    await this.repo.update({ id }, partial);
  }
}
