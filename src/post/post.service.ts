import { Injectable, Logger } from '@nestjs/common';
import { Post } from '../db/post.entity';
import { YTProvider } from '../youtube/yt.provider';
import { PostRepo } from './post.repo';
import { isBackstagePost } from './post.util';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly ownerMap = new Map<string, string>();

  constructor(
    private readonly repo: PostRepo,
    private readonly ytProvider: YTProvider,
  ) { }

  registerOwner(postId: string, ownerId: string): void {
    this.ownerMap.set(postId, ownerId);
  }

  async pollPosts(): Promise<void> {
    const posts = await this.repo.findUnfetched();
    for (const post of posts) {
      await this.fetchPost(post);
    }
  }

  private async fetchPost(post: Post): Promise<void> {
    const ownerId = this.ownerMap.get(post.id);
    if (!ownerId) {
      return;
    }

    const yt = this.ytProvider.getYt(ownerId);
    if (!yt) {
      return;
    }

    try {
      const res = await yt.getPost(post.id, post.channel_id);
      const p = res.posts[0];

      if (p && isBackstagePost(p)) {
        await this.repo.update(post.id, {
          updated_at: Date.now(),
          fetched_at: Date.now(),
          published_at: post.created_at,
          content: p.content,
          attachment: p.attachment,
        });
        this.logger.debug(`fetchPost: updated ${post.id}`);
      } else {
        if (p) {
          this.logger.warn(`fetchPost: unexpected type for ${post.id}: ${(p as any).type}`);
        }
        await this.repo.update(post.id, {
          updated_at: Date.now(),
          fetched_at: Date.now(),
        });
      }
    } catch (err) {
      this.logger.warn(`fetchPost: failed for ${post.id}`, err);
      await this.repo.update(post.id, {
        updated_at: Date.now(),
        fetched_at: Date.now(),
      });
    }

    this.ownerMap.delete(post.id);
  }
}
