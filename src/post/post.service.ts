import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import * as chrono from 'chrono-node';
import { createHash } from 'crypto';
import Innertube, { YTNodes } from 'youtubei.js';
import { AccountService } from '../account/account.service';
import { ChannelService } from '../channel/channel.service';
import { IdUtil } from '../common/id.util';
import { ConfigService } from '../config/config.service';
import { Post } from '../db/post.entity';
import { YTProvider } from '../youtube/yt.provider';
import { PostHistoryRepo } from './post-history.repo';
import { PostRepo } from './post.repo';
import { isBackstagePost } from './post.util';

interface MergedPost {
  id: string;
  channel_id: string;
  source: 'yt' | 'orphan';
  post?: YTNodes.BackstagePost | YTNodes.SharedPost;
  _computed_published_at: number;
}

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly ownerMap = new Map<string, string>();
  private readonly fetchingChannels = new Set<string>();

  constructor(
    private readonly repo: PostRepo,
    private readonly ytProvider: YTProvider,
    private readonly configService: ConfigService,
    private readonly historyRepo: PostHistoryRepo,
    private readonly accountService: AccountService,
    private readonly channelService: ChannelService,
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
          type: p.type,
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
          type: (p as any)?.type,
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

  async fetchCommunityPosts(channelId: string, ownerId?: string): Promise<{ total: number; inserted: number; updated: number }> {
    if (this.fetchingChannels.has(channelId)) {
      throw new ConflictException(`Channel ${channelId} is already being fetched`);
    }

    this.fetchingChannels.add(channelId);

    try {
      const owner = this.resolveOwner(ownerId);
      const yt = this.ytProvider.getYt(owner);
      if (!yt) {
        throw new BadRequestException(`No Innertube session for ${owner}`);
      }

      const ytPosts = await this.fetchAllPosts(yt, channelId);
      if (ytPosts.length === 0) {
        return { total: 0, inserted: 0, updated: 0 };
      }

      const finishedAt = Date.now();

      this.computeTimestamps(ytPosts);

      const merged = await this.mergeOrphans(ytPosts, channelId);

      this.assignTimestamps(merged);

      const allIds = merged.map(p => p.id);
      const existingRows = await this.repo.findByIds(allIds);
      const existingMap = new Map(existingRows.map(r => [r.id, r]));

      const { inserted, updated } = await this.upsertPosts(merged, existingMap, finishedAt);

      return { total: ytPosts.length, inserted, updated };
    } finally {
      this.fetchingChannels.delete(channelId);
    }
  }

  private resolveOwner(ownerId?: string): string {
    if (ownerId) {
      const account = this.accountService.getAccount(ownerId);
      if (!account) {
        throw new BadRequestException(`Owner ${ownerId} not found`);
      }
      return ownerId;
    }
    const selected = this.accountService.getAccounts().find(a => a.is_selected);
    if (!selected) {
      throw new BadRequestException('No selected account and no owner_id provided');
    }
    return selected.id;
  }

  private async fetchAllPosts(yt: Innertube, channelId: string): Promise<(YTNodes.BackstagePost | YTNodes.SharedPost)[]> {
    const channel = await this.channelService.fetchChannel(yt, channelId);

    let feed: any = null;
    const allPosts: (YTNodes.BackstagePost | YTNodes.SharedPost)[] = [];

    do {
      try {
        feed = feed
          ? await feed.getContinuation()
          : await channel.getTabByURL('posts');
      } catch (err) {
        this.logger.warn(`fetchAllPosts: pagination error for ${channelId}`, err);
        break;
      }

      for (const post of feed.posts) {
        if (post.type !== 'BackstagePost' && post.type !== 'SharedPost') {
          this.logger.error(`fetchAllPosts: unexpected post type "${post.type}" for ${post.id} on channel ${channelId}`, { channelId, post: { id: post.id, type: post.type } });
          throw new Error(`Unexpected post type: ${post.type} for ${post.id} on channel ${channelId}`);
        }
        allPosts.push(post);
      }
    } while (feed.has_continuation);

    return allPosts;
  }

  private computeTimestamps(posts: (YTNodes.BackstagePost | YTNodes.SharedPost)[]): void {
    let prevTs = Infinity;

    for (const post of posts) {
      const raw = post.published.toString();
      if (!raw) {
        this.logger.error(`computeTimestamps: empty published string for post ${post.id}`);
        throw new Error(`Failed to parse published time for post ${post.id}: empty string`);
      }

      const parsed = chrono.parseDate(raw);
      if (!parsed) {
        this.logger.error(`computeTimestamps: unable to parse "${raw}" for post ${post.id}`);
        throw new Error(`Failed to parse published time for post ${post.id}: "${raw}"`);
      }

      let ts = parsed.getTime();
      // Subtract stable post-ID micro-offset for deterministic tiebreaking
      const microOffset = this.extractPostIdTs(post.id) % 60_000;
      ts = ts - microOffset;

      if (ts >= prevTs) {
        ts = prevTs - 60_000;
      }
      prevTs = ts;
      (post as any)._computed_published_at = ts;
    }
  }

  // Deterministic microsecond-level value from post ID for stable ordering
  private extractPostIdTs(postId: string): number {
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash) + postId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private async mergeOrphans(
    ytPosts: (YTNodes.BackstagePost | YTNodes.SharedPost)[],
    channelId: string,
  ): Promise<MergedPost[]> {
    const ytIds = new Set(ytPosts.map(p => p.id));
    const dbPosts = await this.repo.findAllByChannel(channelId);

    const orphanAnchor = new Map<string, string>();
    for (let i = 0; i < dbPosts.length; i++) {
      if (ytIds.has(dbPosts[i].id)) {
        continue;
      }
      for (let j = i + 1; j < dbPosts.length; j++) {
        if (ytIds.has(dbPosts[j].id)) {
          orphanAnchor.set(dbPosts[i].id, dbPosts[j].id);
          break;
        }
      }
    }

    const merged: MergedPost[] = [];
    const placedOrphans = new Set<string>();

    for (const ytPost of ytPosts) {
      for (const [orphanId, anchorId] of orphanAnchor) {
        if (anchorId === ytPost.id && !placedOrphans.has(orphanId)) {
          const dbPost = dbPosts.find(p => p.id === orphanId)!;
          merged.push({
            id: dbPost.id,
            channel_id: dbPost.channel_id!,
            source: 'orphan',
            _computed_published_at: dbPost.published_at!,
          });
          placedOrphans.add(orphanId);
        }
      }
      merged.push({
        id: ytPost.id,
        channel_id: channelId,
        source: 'yt',
        post: ytPost,
        _computed_published_at: 0,
      });
    }

    for (const dbPost of dbPosts) {
      if (!ytIds.has(dbPost.id) && !placedOrphans.has(dbPost.id)) {
        merged.push({
          id: dbPost.id,
          channel_id: dbPost.channel_id!,
          source: 'orphan',
          _computed_published_at: dbPost.published_at!,
        });
      }
    }

    return merged;
  }

  private assignTimestamps(merged: MergedPost[]): void {
    let prevTs = Infinity;

    for (const item of merged) {
      if (item.source === 'yt' && item.post) {
        let ts = (item.post as any)._computed_published_at as number;
        if (ts >= prevTs) {
          ts = prevTs - 60_000;
        }
        item._computed_published_at = ts;
        prevTs = ts;
      } else {
        // Orphan: locked — keep existing DB timestamp as anchor
        prevTs = item._computed_published_at;
      }
    }
  }

  private async upsertPosts(
    merged: MergedPost[],
    existingMap: Map<string, Pick<Post, 'id' | 'channel_id' | 'created_at' | 'published_at' | 'initiator'>>,
    finishedAt: number,
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const item of merged) {
      const existing = existingMap.get(item.id);
      const post = item.source === 'yt' ? item.post : undefined;
      const content = post ? (post as any).content : undefined;
      const attachment = post ? (post as any).attachment : undefined;
      const type = post ? (post as any).type : undefined;

      if (!existing) {
        await this.repo.upsert({
          id: item.id,
          channel_id: item.channel_id,
          created_at: finishedAt,
          updated_at: finishedAt,
          fetched_at: finishedAt,
          published_at: item._computed_published_at,
          initiator: 'tab',
          type,
          content,
          attachment,
        });
        inserted++;
      } else {
        const updateFields: Partial<Post> = {
          updated_at: finishedAt,
          type,
          content,
          attachment,
          fetched_at: finishedAt,
        };

        const isLocked = existing.initiator === 'notification' || item.source === 'orphan';
        if (!isLocked) {
          updateFields.published_at = item._computed_published_at;
          updateFields.initiator = 'tab';
        }

        await this.repo.update(item.id, updateFields);

        const contentChanged = !!(content || attachment);
        const timestampChanged = !isLocked
          && existing.published_at !== item._computed_published_at;
        if (contentChanged || timestampChanged) {
          updated++;
        }
      }

      if (content) {
        await this.trackHistory(item.id, 'content', content);
      }
      if (attachment) {
        await this.trackHistory(item.id, 'attachment', attachment);
      }
    }

    return { inserted, updated };
  }
}
