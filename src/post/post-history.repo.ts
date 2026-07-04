import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostHistory } from '../db/post-history.entity';

@Injectable()
export class PostHistoryRepo {
  constructor(
    @InjectRepository(PostHistory)
    private readonly repo: Repository<PostHistory>,
  ) { }

  async findLatest(postId: string, key: string): Promise<PostHistory | null> {
    return this.repo.findOne({
      where: { post_id: postId, key },
      order: { created_at: 'DESC' },
    });
  }

  async insert(data: Partial<PostHistory>): Promise<void> {
    await this.repo.insert(data);
  }
}
