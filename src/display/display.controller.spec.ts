import { Test, TestingModule } from '@nestjs/testing';
import { DisplayController } from './display.controller';
import { NotificationService } from '../notification/notification.service';

describe('DisplayController', () => {
  let controller: DisplayController;
  let notificationService: { getNotifications: jest.Mock };

  beforeEach(async () => {
    notificationService = { getNotifications: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisplayController],
      providers: [{ provide: NotificationService, useValue: notificationService }],
    }).compile();
    controller = module.get<DisplayController>(DisplayController);
  });

  it('GET / should return HTML', () => {
    const res = { type: jest.fn().mockReturnValue({ send: jest.fn() }) };
    controller.index(res as any);
    expect(res.type).toHaveBeenCalledWith('html');
  });

  it('GET /api/notifications should return paginated JSON with parsed short_message and link', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 1, limit: 50, offset: 0,
      items: [{ id: '123', created_at: 1, sent_at: 1, video_id: 'vid', linked_comment_id: null, endpoint_url: '/watch?v=vid', short_message: { text: 'hi', rtl: false }, thumbnail_url: 'img.jpg' }],
    });

    const result = await controller.getNotifications(50, 0);
    expect(result.total).toBe(1);
    expect(result.items[0].short_message).toEqual({ text: 'hi', rtl: false });
    expect(result.items[0]._linkUrl).toBe('https://youtube.com/watch?v=vid');
  });

  it('GET /api/notifications/latest should return newest item', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 1, limit: 1, offset: 0,
      items: [{ id: 'latest', created_at: 1, sent_at: 1, video_id: null, linked_comment_id: null, endpoint_url: null, short_message: { text: "newest", rtl: false }, thumbnail_url: null }],
    });

    const result = await controller.getLatest();
    expect(result.item.id).toBe('latest');
    expect(result.item.short_message).toEqual({ text: 'newest', rtl: false });
    expect((result.item as any)._linkUrl).toBeNull();
  });

  it('GET /api/notifications/latest should return null item when empty', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 0, limit: 1, offset: 0, items: [],
    });

    const result = await controller.getLatest();
    expect(result.item).toBeNull();
  });
});
