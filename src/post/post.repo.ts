import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../db/post.entity';

@Injectable()
export class PostRepo {
  constructor(
    @InjectRepository(Post)
    private readonly repo: Repository<Post>,
  ) { }

  async upsert(post: Partial<Post>): Promise<void> {
    await this.repo.upsert(post, { conflictPaths: ['post_id'] });
  }
}
