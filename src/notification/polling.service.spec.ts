import { Test, TestingModule } from '@nestjs/testing';
import { PollingService } from './polling.service';
import { NotificationService } from './notification.service';
import { NotificationRepo } from './notification.repo';
import { ConfigService } from '../config/config.service';
import { YTProvider } from '../youtube/yt.provider';
import { DiscordService } from '../discord/discord.service';

jest.useFakeTimers();

describe('PollingService', () => {
  let pollingService: PollingService;
  let ytProvider: { getYt: jest.Mock };
  let notificationService: { processNotifications: jest.Mock; getNotifications: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let discordService: { relayNotification: jest.Mock };
  let repo: { count: jest.Mock };

  beforeEach(async () => {
    ytProvider = { getYt: jest.fn() };
    notificationService = { processNotifications: jest.fn(), getNotifications: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ interval: 60, webhooks: { discord: [] } }) };
    discordService = { relayNotification: jest.fn() };
    repo = { count: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingService,
        { provide: YTProvider, useValue: ytProvider },
        { provide: NotificationService, useValue: notificationService },
        { provide: ConfigService, useValue: configService },
        { provide: DiscordService, useValue: discordService },
        { provide: NotificationRepo, useValue: repo },
      ],
    }).compile();

    pollingService = module.get<PollingService>(PollingService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  // Helper: flush pending microtasks after advancing fake timers
  const flushPromises = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  };

  it('should not relay on first run (empty DB)', async () => {
    repo.count.mockResolvedValue(0);
    ytProvider.getYt.mockResolvedValue({
      getNotifications: jest.fn().mockResolvedValue({ contents: [{ notification_id: '1' }] }),
    });
    notificationService.processNotifications.mockResolvedValue([{ id: '1', short_message: { text: '', rtl: false } }]);

    pollingService.startPolling();
    jest.advanceTimersByTime(61000);
    await flushPromises();

    expect(discordService.relayNotification).not.toHaveBeenCalled();
  });

  it('should relay new notifications on subsequent polls', async () => {
    repo.count.mockResolvedValue(5);
    ytProvider.getYt.mockResolvedValue({
      getNotifications: jest.fn().mockResolvedValue({ contents: [{ notification_id: 'new1' }] }),
    });
    notificationService.processNotifications.mockResolvedValue([{ id: 'new1', short_message: { text: '', rtl: false } }]);

    pollingService.startPolling();
    jest.advanceTimersByTime(61000);
    await flushPromises();

    expect(discordService.relayNotification).toHaveBeenCalledWith({ id: 'new1', short_message: { text: '', rtl: false } });
  });
});
