import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { IdUtil } from '../common/id.util';
import { ConfigService } from '../config/config.service';
import { Post } from '../db/post.entity';
import { YTProvider } from '../youtube/yt.provider';
import { PostHistoryRepo } from './post-history.repo';
import { PostRepo } from './post.repo';
import { isBackstagePost } from './post.util';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly ownerMap = new Map<string, string>();

  constructor(
    private readonly repo: PostRepo,
    private readonly ytProvider: YTProvider,
    private readonly configService: ConfigService,
    private readonly historyRepo: PostHistoryRepo,
  ) { }

  registerOwner(postId: string, ownerId: string): void {
    this.ownerMap.set(postId, ownerId);
  }

  async pollPosts(): Promise<void> {
    const ids = [...this.ownerMap.keys()];
    if (ids.length === 0) {
      return;
    }

    const minAgeMs = this.configService.getConfig().postFetchMinAgeMs!;
    const posts = await this.repo.findToFetch(ids, minAgeMs);
    for (const post of posts) {
      const ownerId = this.ownerMap.get(post.id);
      if (!ownerId) {
        continue;
      }
      await this.fetchPost(post, ownerId);
    }
  }

  private async fetchPost(post: Pick<Post, 'id' | 'channel_id' | 'created_at'>, ownerId: string): Promise<void> {
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
        await this.trackHistory(post.id, 'content', p.content);
        await this.trackHistory(post.id, 'attachment', p.attachment);
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

  private async trackHistory(
    postId: string,
    key: string,
    value: Record<string, any> | null | undefined,
  ): Promise<void> {
    const hash = value
      ? createHash('sha256').update(JSON.stringify(value)).digest('hex')
      : undefined;

    const latest = await this.historyRepo.findLatest(postId, key);
    if (latest && latest.value_hash === hash) {
      return;
    }

    await this.historyRepo.insert({
      id: IdUtil.generate(16),
      created_at: Date.now(),
      post_id: postId,
      key,
      value_hash: hash,
      value: value ?? undefined,
    });
  }
}
