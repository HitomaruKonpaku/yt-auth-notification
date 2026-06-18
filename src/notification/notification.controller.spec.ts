import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: { getNotifications: jest.Mock };

  beforeEach(async () => {
    notificationService = { getNotifications: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: notificationService }],
    }).compile();
    controller = module.get<NotificationController>(NotificationController);
  });

  it('GET /api/notifications should return paginated JSON', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 1, limit: 50, offset: 0,
      items: [{ id: '123', sent_at: 1, video_id: 'vid', short_message: { text: 'hi', rtl: false } }],
    });

    const result = await controller.getNotifications(50, 0);
    expect(result.total).toBe(1);
    expect(result.items[0]._linkUrl).toBeDefined();
  });

  it('GET /api/notifications/latest should return newest item', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 1, limit: 1, offset: 0,
      items: [{ id: 'latest', sent_at: 1, video_id: null, short_message: { text: 'newest', rtl: false } }],
    });

    const result = await controller.getLatest();
    expect(result.item!.id).toBe('latest');
  });

  it('GET /api/notifications/latest should return null when empty', async () => {
    notificationService.getNotifications.mockResolvedValue({
      total: 0, limit: 1, offset: 0, items: [],
    });

    const result = await controller.getLatest();
    expect(result.item).toBeNull();
  });
});
