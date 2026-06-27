import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PostRepo } from './post.repo';
import { YTProvider } from '../youtube/yt.provider';

describe('PostService', () => {
  let service: PostService;
  let repo: { findUnfetched: jest.Mock; update: jest.Mock };
  let ytProvider: { getYt: jest.Mock };

  beforeEach(async () => {
    repo = { findUnfetched: jest.fn().mockResolvedValue([]), update: jest.fn() };
    ytProvider = { getYt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepo, useValue: repo },
        { provide: YTProvider, useValue: ytProvider },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should fetch and update post with content', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor', created_at: 1700000000 },
    ]);

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

  it('should skip post when ownerId not in map', async () => {
    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor' },
    ]);

    await service.pollPosts();

    expect(ytProvider.getYt).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should skip post when getYt returns undefined', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor' },
    ]);
    ytProvider.getYt.mockReturnValue(undefined);

    await service.pollPosts();

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should set fetched_at on non-BackstagePost result', async () => {
    service.registerOwner('post1', 'UC1');
    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor' },
    ]);
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
    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCAuthor' },
    ]);
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
    repo.findUnfetched
      .mockResolvedValueOnce([{ id: 'post1', channel_id: 'UCAuthor' }])
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

    repo.findUnfetched.mockResolvedValue([
      { id: 'post1', channel_id: 'UCA' },
      { id: 'post2', channel_id: 'UCB' },
      { id: 'post3', channel_id: 'UCC' },
    ]);

    ytProvider.getYt.mockReturnValue({
      getPost: jest.fn().mockResolvedValue({
        posts: [{ type: 'BackstagePost', content: { text: 'x' }, attachment: null, created_at: 1 }],
      }),
    });

    await service.pollPosts();

    expect(ytProvider.getYt).toHaveBeenCalledTimes(3);
    expect(repo.update).toHaveBeenCalledTimes(3);
  });

  it('should not call getYt when no unfetched posts', async () => {
    repo.findUnfetched.mockResolvedValue([]);

    await service.pollPosts();

    expect(ytProvider.getYt).not.toHaveBeenCalled();
  });
});
