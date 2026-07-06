import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PostRepo } from './post.repo';
import { createHash } from 'crypto';
import { ConfigService } from '../config/config.service';
import { AccountService } from '../account/account.service';
import { ChannelService } from '../channel/channel.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

jest.mock('chrono-node', () => ({
  parseDate: jest.fn((raw: string) => {
    const map: Record<string, Date> = {
      '2 hours ago': new Date(Date.now() - 2 * 3600_000),
      '1 day ago': new Date(Date.now() - 86400_000),
      '3 days ago': new Date(Date.now() - 3 * 86400_000),
      '3 hours ago': new Date(Date.now() - 3 * 3600_000),
    };
    return map[raw] ?? null;
  }),
}));
import { PostHistoryRepo } from './post-history.repo';
import { YTProvider } from '../youtube/yt.provider';

describe('PostService', () => {
  let service: PostService;
  let repo: { findToFetch: jest.Mock; update: jest.Mock; findByIds: jest.Mock; findAllByChannel: jest.Mock; upsert: jest.Mock };
  let ytProvider: { getYt: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let historyRepo: { findLatest: jest.Mock; insert: jest.Mock };
  let accountService: { getAccount: jest.Mock; getAccounts: jest.Mock };
  let channelService: { fetchChannel: jest.Mock };

  const makePost = (id: string, channel_id: string, created_at?: number) => ({
    id,
    channel_id,
    created_at: created_at ?? 1700000000,
  });

  beforeEach(async () => {
    repo = {
      findToFetch: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([]),
      findAllByChannel: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    };
    ytProvider = { getYt: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ postFetchMinAgeMs: 30 * 60 * 1000 }) };
    historyRepo = { findLatest: jest.fn().mockResolvedValue(null), insert: jest.fn().mockResolvedValue(undefined) };
    accountService = { getAccount: jest.fn(), getAccounts: jest.fn().mockReturnValue([]) };
    channelService = { fetchChannel: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepo, useValue: repo },
        { provide: YTProvider, useValue: ytProvider },
        { provide: ConfigService, useValue: configService },
        { provide: PostHistoryRepo, useValue: historyRepo },
        { provide: AccountService, useValue: accountService },
        { provide: ChannelService, useValue: channelService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should fetch and update post with content', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);

    const mockYt = {
      getPost: jest.fn().mockResolvedValue({
        posts: [{
          type: 'BackstagePost',
          content: { text: 'Hello' },
          attachment: { type: 'Poll' },
        }],
      }),
    };
    ytProvider.getYt.mockReturnValue(mockYt);

    await service.pollPosts();

    expect(ytProvider.getYt).toHaveBeenCalledWith('UC1');
    expect(mockYt.getPost).toHaveBeenCalledWith('post1', 'UCAuthor');
    expect(repo.update).toHaveBeenCalledWith('post1', expect.objectContaining({
      content: { text: 'Hello' },
      attachment: { type: 'Poll' },
      published_at: 1700000000,
      fetched_at: expect.any(Number),
      updated_at: expect.any(Number),
    }));
  });

  it('should skip post when getYt returns undefined', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);
    ytProvider.getYt.mockReturnValue(undefined);

    await service.pollPosts();

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should do nothing when findToFetch returns empty', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([]);

    await service.pollPosts();

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should set fetched_at on non-BackstagePost result', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);
    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({ posts: [{ type: 'SomeOtherType' }] }),
    });

    await service.pollPosts();

    expect(repo.update).toHaveBeenCalledWith('post1', expect.objectContaining({
      fetched_at: expect.any(Number),
      updated_at: expect.any(Number),
    }));
    const call = repo.update.mock.calls[0][1];
    expect(call.content).toBeUndefined();
    expect(call.attachment).toBeUndefined();
  });

  it('should set fetched_at on getPost error', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);
    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockRejectedValue(new Error('network error')),
    });

    await service.pollPosts();

    expect(repo.update).toHaveBeenCalledWith('post1', expect.objectContaining({
      fetched_at: expect.any(Number),
      updated_at: expect.any(Number),
    }));
  });

  it('should delete ownerMap entry after processing', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch
      .mockResolvedValueOnce([makePost('post1', 'UCAuthor')])
      .mockResolvedValueOnce([]);

    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({ posts: [{ type: 'SomeOtherType' }] }),
    });

    await service.pollPosts();
    await service.pollPosts();

    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple posts in one poll', async () => {
    service.registerOwner('post1', 'UC1');
    service.registerOwner('post2', 'UC1');
    service.registerOwner('post3', 'UC2');

    repo.findToFetch.mockResolvedValue([
      makePost('post1', 'UCA'),
      makePost('post2', 'UCB'),
      makePost('post3', 'UCC'),
    ]);
    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({
        posts: [{ type: 'BackstagePost', content: { text: 'x' }, attachment: null }],
      }),
    });

    await service.pollPosts();

    expect(ytProvider.getYt).toHaveBeenCalledTimes(3);
    expect(repo.update).toHaveBeenCalledTimes(3);
  });

  it('should not call findToFetch when no registered posts', async () => {
    await service.pollPosts();

    expect(repo.findToFetch).not.toHaveBeenCalled();
  });

  it('should insert history row on first fetch', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);
    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({
        posts: [{ type: 'BackstagePost', content: { text: 'Hello' }, attachment: null }],
      }),
    });

    await service.pollPosts();

    expect(historyRepo.insert).toHaveBeenCalledTimes(2);
    expect(historyRepo.insert).toHaveBeenCalledWith(expect.objectContaining({
      post_id: 'post1',
      key: 'content',
      value_hash: expect.any(String),
      value: { text: 'Hello' },
    }));
    expect(historyRepo.insert).toHaveBeenCalledWith(expect.objectContaining({
      post_id: 'post1',
      key: 'attachment',
      value_hash: undefined,
      value: undefined,
    }));
  });

  it('should skip history insert when content unchanged', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findToFetch.mockResolvedValue([makePost('post1', 'UCAuthor')]);
    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({
        posts: [{ type: 'BackstagePost', content: { text: 'Same' }, attachment: null }],
      }),
    });
    historyRepo.findLatest.mockImplementation((_postId: string, key: string) => {
      if (key === 'content') {
        return Promise.resolve({
          id: 'hist1',
          post_id: 'post1',
          key: 'content',
          value_hash: createHash('sha256').update(JSON.stringify({ text: 'Same' })).digest('hex'),
          value: { text: 'Same' },
        });
      }
      return Promise.resolve(null);
    });

    await service.pollPosts();

    // Only attachment gets inserted (null, first time); content skipped
    expect(historyRepo.insert).toHaveBeenCalledTimes(1);
    expect(historyRepo.insert).toHaveBeenCalledWith(expect.objectContaining({
      key: 'attachment',
      value_hash: undefined,
    }));
  });
});

// --- fetchCommunityPosts test helpers ---

const makeYtPost = (id: string, publishedText: string) => ({
  id,
  type: 'BackstagePost',
  published: { toString: () => publishedText },
  content: { text: `Content ${id}` },
  attachment: null,
  channel_id: 'UCAuthor',
});

// --- fetchCommunityPosts tests ---

describe('fetchCommunityPosts', () => {
  let service: PostService;
  let repo: { findToFetch: jest.Mock; update: jest.Mock; findByIds: jest.Mock; findAllByChannel: jest.Mock; upsert: jest.Mock };
  let ytProvider: { getYt: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let historyRepo: { findLatest: jest.Mock; insert: jest.Mock };
  let accountService: { getAccount: jest.Mock; getAccounts: jest.Mock };
  let channelService: { fetchChannel: jest.Mock };

  beforeEach(async () => {
    repo = {
      findToFetch: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([]),
      findAllByChannel: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    };
    ytProvider = { getYt: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ postFetchMinAgeMs: 30 * 60 * 1000 }) };
    historyRepo = { findLatest: jest.fn().mockResolvedValue(null), insert: jest.fn().mockResolvedValue(undefined) };
    accountService = { getAccount: jest.fn(), getAccounts: jest.fn().mockReturnValue([]) };
    channelService = { fetchChannel: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepo, useValue: repo },
        { provide: YTProvider, useValue: ytProvider },
        { provide: ConfigService, useValue: configService },
        { provide: PostHistoryRepo, useValue: historyRepo },
        { provide: AccountService, useValue: accountService },
        { provide: ChannelService, useValue: channelService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });
  it('should reject concurrent fetch for same channel', async () => {
    (service as any).fetchingChannels.add('UC1');
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow(ConflictException);
    (service as any).fetchingChannels.delete('UC1');
  });

  it('should throw when no selected account and no owner_id', async () => {
    accountService.getAccounts.mockReturnValue([]);
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow(BadRequestException);
  });

  it('should throw when owner_id not found', async () => {
    accountService.getAccount.mockReturnValue(undefined);
    await expect(service.fetchCommunityPosts('UC1', 'UC_BAD')).rejects.toThrow(BadRequestException);
  });

  it('should throw when Innertube session not available', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue(undefined);
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow(BadRequestException);
  });

  it('should return zero totals for empty feed', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({ posts: [], has_continuation: false }),
    });

    const result = await service.fetchCommunityPosts('UC1');
    expect(result).toEqual({ total: 0, inserted: 0, updated: 0 });
  });

  it('should insert new posts', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [makeYtPost('post1', '2 hours ago'), makeYtPost('post2', '1 day ago')],
        has_continuation: false,
      }),
    });
    repo.findByIds.mockResolvedValue([]);
    repo.findAllByChannel.mockResolvedValue([]);

    const result = await service.fetchCommunityPosts('UC1');
    expect(result.total).toBe(2);
    expect(result.inserted).toBe(2);
    expect(result.updated).toBe(0);
  });

  it('should skip published_at+initiator for notification-origin posts', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [makeYtPost('post1', '2 hours ago')],
        has_continuation: false,
      }),
    });
    repo.findAllByChannel.mockResolvedValue([]);
    repo.findByIds.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor', created_at: 100, published_at: 200, initiator: 'notification' },
    ]);

    const result = await service.fetchCommunityPosts('UC1');
    expect(result.updated).toBe(1);
    const updateCall = repo.update.mock.calls[0][1];
    expect(updateCall.published_at).toBeUndefined();
    expect(updateCall.initiator).toBeUndefined();
  });

  it('should throw on unparseable time', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [{ id: 'bad1', type: 'BackstagePost', published: { toString: () => 'gibberish' }, content: null, attachment: null, channel_id: 'x' }],
        has_continuation: false,
      }),
    });
    repo.findAllByChannel.mockResolvedValue([]);
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow('Failed to parse published time');
  });

  it('should throw on unknown post type', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [{ id: 'post1', type: 'SomeUnknownType' }],
        has_continuation: false,
      }),
    });
    repo.findAllByChannel.mockResolvedValue([]);
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow('Unexpected post type');
  });

  it('should handle pagination error gracefully', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    const page1 = {
      posts: [makeYtPost('post1', '2 hours ago')],
      has_continuation: true,
      getContinuation: jest.fn().mockRejectedValue(new Error('network error')),
    };
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({ getTabByURL: jest.fn().mockResolvedValue(page1) });
    repo.findByIds.mockResolvedValue([]);
    repo.findAllByChannel.mockResolvedValue([]);

    const result = await service.fetchCommunityPosts('UC1');
    expect(result.total).toBe(1);
    expect(result.inserted).toBe(1);
  });

  it('should merge orphan posts in correct order', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [
          makeYtPost('postF', '2 hours ago'),
          makeYtPost('postE', '3 hours ago'),
          makeYtPost('postC', '1 day ago'),
          makeYtPost('postA', '3 days ago'),
        ],
        has_continuation: false,
      }),
    });
    repo.findAllByChannel.mockResolvedValue([
      { id: 'postD', channel_id: 'UCAuthor', published_at: 1700000100 },
      { id: 'postC', channel_id: 'UCAuthor', published_at: 1700000090 },
      { id: 'postB', channel_id: 'UCAuthor', published_at: 1700000080 },
      { id: 'postA', channel_id: 'UCAuthor', published_at: 1700000070 },
    ]);
    repo.findByIds.mockResolvedValue([]);

    await service.fetchCommunityPosts('UC1');
    const calls = repo.upsert.mock.calls;
    expect(calls.map((c: any) => c[0].id)).toEqual(['postF', 'postE', 'postD', 'postC', 'postB', 'postA']);
  });

  it('should lock orphan timestamps when YT feed is a subset of DB', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue({});
    channelService.fetchChannel.mockResolvedValue({
      getTabByURL: jest.fn().mockResolvedValue({
        posts: [makeYtPost('post2', '2 hours ago'), makeYtPost('post1', '1 day ago')],
        has_continuation: false,
      }),
    });

    const ts = { post5: 1700000500, post4: 1700000400, post3: 1700000300, post2: 1700000200, post1: 1700000100 };
    repo.findAllByChannel.mockResolvedValue([
      { id: 'post5', channel_id: 'UCAuthor', published_at: ts.post5 },
      { id: 'post4', channel_id: 'UCAuthor', published_at: ts.post4 },
      { id: 'post3', channel_id: 'UCAuthor', published_at: ts.post3 },
      { id: 'post2', channel_id: 'UCAuthor', published_at: ts.post2 },
      { id: 'post1', channel_id: 'UCAuthor', published_at: ts.post1 },
    ]);
    repo.findByIds.mockResolvedValue([]);

    await service.fetchCommunityPosts('UC1');
    const calls = repo.upsert.mock.calls;
    expect(calls.map((c: any) => c[0].id)).toEqual(['post5', 'post4', 'post3', 'post2', 'post1']);
    expect(calls[0][0].published_at).toBe(ts.post5);
    expect(calls[1][0].published_at).toBe(ts.post4);
    expect(calls[2][0].published_at).toBe(ts.post3);
  });

  it('should release lock on error', async () => {
    accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
    ytProvider.getYt.mockReturnValue(undefined);
    await expect(service.fetchCommunityPosts('UC1')).rejects.toThrow();
    expect((service as any).fetchingChannels.has('UC1')).toBe(false);
  });
});
