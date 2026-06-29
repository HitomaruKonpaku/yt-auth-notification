import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async findToFetch(ids: string[]): Promise<Pick<Post, 'id' | 'channel_id' | 'created_at'>[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repo.find({
      select: { id: true, channel_id: true, created_at: true },
      where: { id: In(ids) },
    });
  }

  async upsert(post: Partial<Post>): Promise<void> {
    await this.repo.upsert(post, { conflictPaths: ['id'] });
  }

  async update(id: string, partial: Partial<Post>): Promise<void> {
    await this.repo.update({ id }, partial);
  }
}
