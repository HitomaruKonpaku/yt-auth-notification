import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PostRepo } from './post.repo';
import { createHash } from 'crypto';
import { ConfigService } from '../config/config.service';
import { PostHistoryRepo } from './post-history.repo';
import { YTProvider } from '../youtube/yt.provider';

describe('PostService', () => {
  let service: PostService;
  let repo: { findToFetch: jest.Mock; update: jest.Mock };
  let ytProvider: { getYt: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let historyRepo: { findLatest: jest.Mock; insert: jest.Mock };

  const makePost = (id: string, channel_id: string, created_at?: number) => ({
    id,
    channel_id,
    created_at: created_at ?? 1700000000,
  });

  beforeEach(async () => {
    repo = { findToFetch: jest.fn().mockResolvedValue([]), update: jest.fn() };
    ytProvider = { getYt: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ postFetchMinAgeMs: 30 * 60 * 1000 }) };
    historyRepo = { findLatest: jest.fn().mockResolvedValue(null), insert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepo, useValue: repo },
        { provide: YTProvider, useValue: ytProvider },
        { provide: ConfigService, useValue: configService },
        { provide: PostHistoryRepo, useValue: historyRepo },
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
