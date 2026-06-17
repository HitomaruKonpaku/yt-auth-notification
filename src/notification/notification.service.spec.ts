import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepo } from './notification.repo';
import { PostRepo } from '../post/post.repo';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: { upsertAll: jest.Mock; count: jest.Mock; findAll: jest.Mock };
  let postRepo: { upsert: jest.Mock };

  const makeRaw = (id: string, text: string, opts?: { videoId?: string; linkedCommentId?: string; browseId?: string; params?: string }) => ({
    notification_id: id,
    short_message: { text, rtl: false },
    thumbnails: [{ url: `https://avatar/${id}.jpg` }],
    endpoint: {
      metadata: { url: `/watch?v=${opts?.videoId ?? id}` },
      payload: {
        videoId: opts?.videoId ?? id,
        linkedCommentId: opts?.linkedCommentId,
        browseId: opts?.browseId,
        params: opts?.params,
      },
    },
  });

  const FE_POST_PARAMS = 'wgNcEhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2caJFVna3g1WGwyNE9kZmZHTDVsMlVlSE9XZ1hfR3QtZFNZQmlIdiACWhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2c';

  beforeEach(async () => {
    repo = { upsertAll: jest.fn().mockResolvedValue([]), count: jest.fn(), findAll: jest.fn() };
    postRepo = { upsert: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepo, useValue: repo },
        { provide: PostRepo, useValue: postRepo },
      ],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  it('should upsert all and return only new items', async () => {
    repo.upsertAll.mockResolvedValue(['1', '3']);
    const result = await service.processNotifications(
      [makeRaw('1', 'A'), makeRaw('2', 'B'), makeRaw('3', 'C')] as any,
      'UC123',
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
    expect(repo.upsertAll).toHaveBeenCalledTimes(1);
  });

  it('should set owner_id on every row', async () => {
    repo.upsertAll.mockResolvedValue(['1']);
    await service.processNotifications([makeRaw('1', 'Test')] as any, 'UC456');
    const rows = repo.upsertAll.mock.calls[0][0];
    expect(rows[0].owner_id).toBe('UC456');
  });

  it('should leave owner_id undefined when channel not resolved', async () => {
    repo.upsertAll.mockResolvedValue(['1']);
    await service.processNotifications([makeRaw('1', 'Test')] as any);
    const rows = repo.upsertAll.mock.calls[0][0];
    expect(rows[0].owner_id).toBeUndefined();
  });

  it('should handle missing optional fields', async () => {
    repo.upsertAll.mockResolvedValue(['1000']);
    const raw = [{ notification_id: '1000', short_message: { text: 'Minimal', rtl: false }, thumbnails: [], endpoint: { metadata: {}, payload: {} } }];
    const result = await service.processNotifications(raw as any);
    expect(result[0].video_id).toBeUndefined();
    expect(result[0].linked_comment_id).toBeUndefined();
    expect(result[0].post_id).toBeUndefined();
    expect(result[0].thumbnail_url).toBeUndefined();
  });

  it('should extract linked_comment_id', async () => {
    repo.upsertAll.mockResolvedValue(['5000']);
    const raw = [makeRaw('5000', 'Comment', { linkedCommentId: 'lc123' })];
    const result = await service.processNotifications(raw as any);
    expect(result[0].linked_comment_id).toBe('lc123');
  });

  it('should parse FEpost_detail params and set post_id + upsert post', async () => {
    repo.upsertAll.mockResolvedValue(['8000']);
    const raw = [makeRaw('8000', 'Members post', { browseId: 'FEpost_detail', params: FE_POST_PARAMS, videoId: undefined })];
    const result = await service.processNotifications(raw as any, 'UC123');
    expect(result[0].post_id).toBe('Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv');
    expect(postRepo.upsert).toHaveBeenCalledWith({
      post_id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv',
      channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg',
      created_at: expect.any(Number),
    });
  });

  it('should ignore post upsert errors', async () => {
    postRepo.upsert.mockRejectedValue(new Error('DB error'));
    repo.upsertAll.mockResolvedValue(['9000']);
    const raw = [makeRaw('9000', 'Members post', { browseId: 'FEpost_detail', params: FE_POST_PARAMS, videoId: undefined })];
    const result = await service.processNotifications(raw as any, 'UC123');
    // Should still set post_id on the row even if upsert failed
    expect(result[0].post_id).toBe('Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv');
    expect(result).toHaveLength(1);
  });

  it('should not parse non-FEpost_detail notifications', async () => {
    repo.upsertAll.mockResolvedValue(['7000']);
    const raw = [makeRaw('7000', 'Video upload', { browseId: undefined, videoId: 'abc123' })];
    const result = await service.processNotifications(raw as any);
    expect(result[0].post_id).toBeUndefined();
    expect(postRepo.upsert).not.toHaveBeenCalled();
  });

  it('should return empty array when no new items', async () => {
    repo.upsertAll.mockResolvedValue([]);
    const result = await service.processNotifications(
      [makeRaw('1', 'Old')] as any,
      'UC123',
    );
    expect(result).toHaveLength(0);
  });

  it('should return paginated results via getNotifications', async () => {
    repo.count.mockResolvedValue(42);
    repo.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await service.getNotifications(10, 0);
    expect(result.total).toBe(42);
    expect(result.items).toHaveLength(1);
  });
});
