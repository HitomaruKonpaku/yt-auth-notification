import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepo } from './notification.repo';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: { findExistingIds: jest.Mock; insert: jest.Mock; count: jest.Mock; findAll: jest.Mock };

  const makeRaw = (id: string, text: string) => ({
    notification_id: id,
    short_message: { text, rtl: false },
    thumbnails: [{ url: `https://avatar/${id}.jpg` }],
    endpoint: { metadata: { url: `/watch?v=${id}` }, payload: { videoId: id } },
  });

  beforeEach(async () => {
    repo = { findExistingIds: jest.fn(), insert: jest.fn().mockResolvedValue(undefined), count: jest.fn(), findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: NotificationRepo, useValue: repo }],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  it('should extract and return new notifications only', async () => {
    repo.findExistingIds.mockResolvedValue(new Set());
    repo.count.mockResolvedValue(0);
    const result = await service.processNotifications([makeRaw('1', 'Test'), makeRaw('2', 'Another')] as any);
    expect(result).toHaveLength(2);
    expect(result[0].video_id).toBe('1');
    expect(repo.insert).toHaveBeenCalledTimes(2);
  });

  it('should skip existing notifications', async () => {
    repo.findExistingIds.mockResolvedValue(new Set(['1']));
    repo.count.mockResolvedValue(1);
    const result = await service.processNotifications([makeRaw('1', 'Old'), makeRaw('2', 'New')] as any);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should handle missing optional fields', async () => {
    repo.findExistingIds.mockResolvedValue(new Set());
    repo.count.mockResolvedValue(0);
    const raw = [{ notification_id: '1000', short_message: { text: 'Minimal', rtl: false }, thumbnails: [], endpoint: { metadata: {}, payload: {} } }];
    const result = await service.processNotifications(raw as any);
    expect(result[0].video_id).toBeUndefined();
    expect(result[0].linked_comment_id).toBeUndefined();
    expect(result[0].thumbnail_url).toBeUndefined();
  });

  it('should extract linked_comment_id from comment notifications', async () => {
    repo.findExistingIds.mockResolvedValue(new Set());
    repo.count.mockResolvedValue(0);
    const raw = [{ notification_id: '5000', short_message: { text: 'Comment', rtl: false }, thumbnails: [], endpoint: { metadata: { url: '/watch?v=vid' }, payload: { videoId: 'vid', linkedCommentId: 'lc123' } } }];
    const result = await service.processNotifications(raw as any);
    expect(result[0].linked_comment_id).toBe('lc123');
  });

  it('should return paginated results via getNotifications', async () => {
    repo.count.mockResolvedValue(42);
    repo.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await service.getNotifications(10, 0);
    expect(result.total).toBe(42);
    expect(result.items).toHaveLength(1);
  });
});
