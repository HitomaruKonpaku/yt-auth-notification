import { Test, TestingModule } from '@nestjs/testing';
import { PollingService } from './polling.service';
import { NotificationService } from './notification.service';
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

  beforeEach(async () => {
    ytProvider = { getYt: jest.fn() };
    notificationService = { processNotifications: jest.fn(), getNotifications: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ interval: 60, webhooks: { discord: [] } }) };
    discordService = { relayNotification: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingService,
        { provide: YTProvider, useValue: ytProvider },
        { provide: NotificationService, useValue: notificationService },
        { provide: ConfigService, useValue: configService },
        { provide: DiscordService, useValue: discordService },
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

  it('should relay notifications on first poll', async () => {
    ytProvider.getYt.mockResolvedValue({
      getNotifications: jest.fn().mockResolvedValue({ contents: [{ notification_id: '1' }] }),
    });
    notificationService.processNotifications.mockResolvedValue([{ id: '1', short_message: { text: '', rtl: false } }]);

    pollingService.startPolling();
    jest.advanceTimersByTime(61000);
    await flushPromises();

    expect(discordService.relayNotification).toHaveBeenCalledWith({ id: '1', short_message: { text: '', rtl: false } });
  });
});
