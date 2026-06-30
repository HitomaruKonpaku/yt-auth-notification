import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { ChannelService } from '../channel/channel.service';
import { ConfigService } from '../config/config.service';
import { SseService } from '../sse/sse.service';
import { YTProvider } from '../youtube/yt.provider';
import { CookieService } from '../youtube/cookie.service';
import { HealthCheckService } from '../healthcheck/healthcheck.service';
import { EventEmitter } from 'events';

describe('AccountService', () => {
  let service: AccountService;
  let channelService: { upsert: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let sseService: { push: jest.Mock };
  let ytProvider: { initYt: jest.Mock; setYt: jest.Mock };
  let cookieService: EventEmitter & { getCookieString?: jest.Mock };
  let healthCheckService: { markSessionValid: jest.Mock; markSessionExpired: jest.Mock };

  const makeChannel = (opts: {
    channel_handle: string;
    account_name: string;
    is_selected?: boolean;
    is_disabled?: boolean;
    account_photo?: { url: string }[];
    supportedTokens?: any[];
  }) => ({
    channel_handle: opts.channel_handle,
    account_name: opts.account_name,
    is_selected: opts.is_selected ?? true,
    is_disabled: opts.is_disabled ?? false,
    account_photo: opts.account_photo ?? [],
    endpoint: opts.supportedTokens ? {
      payload: { supportedTokens: opts.supportedTokens },
    } : undefined,
  });

  const makeYt = (channels: any[], channelIdMap?: Record<string, string>) => ({
    account: {
      getInfo: jest.fn().mockResolvedValue(channels),
    },
    resolveURL: jest.fn().mockImplementation((url: string) => {
      const handle = url.replace('https://www.youtube.com/', '');
      const id = channelIdMap?.[handle] ?? 'UC_' + handle.replace('@', '');
      return Promise.resolve({ payload: { browseId: id } });
    }),
  });

  beforeEach(async () => {
    channelService = { upsert: jest.fn().mockResolvedValue(undefined) };
    configService = { getConfig: jest.fn().mockReturnValue({ accountInitRetries: 3 }) };
    sseService = { push: jest.fn() };
    ytProvider = { initYt: jest.fn(), setYt: jest.fn() };
    cookieService = Object.assign(new EventEmitter(), { getCookieString: jest.fn() });
    healthCheckService = { markSessionValid: jest.fn(), markSessionExpired: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: ChannelService, useValue: channelService },
        { provide: ConfigService, useValue: configService },
        { provide: SseService, useValue: sseService },
        { provide: YTProvider, useValue: ytProvider },
        { provide: CookieService, useValue: cookieService },
        { provide: HealthCheckService, useValue: healthCheckService },
      ],
    }).compile();
    service = module.get<AccountService>(AccountService);
  });

  it('should discover and store active channel, reuse main session', async () => {
    const ch = makeChannel({
      channel_handle: '@test',
      account_name: 'Test Channel',
      account_photo: [{ url: 'https://img/photo.jpg' }],
    });
    const yt = makeYt([ch], { '@test': 'UC123' });
    ytProvider.initYt.mockResolvedValueOnce(yt); // __main__ session

    await service.initialize();

    const info = service.getAccount('UC123');
    expect(info).toBeDefined();
    expect(info!.handle).toBe('@test');
    expect(info!.name).toBe('Test Channel');
    expect(info!.thumbnail_url).toBe('https://img/photo.jpg');
    expect(info!.is_selected).toBe(true);
    expect(info!.is_disabled).toBe(false);
    expect(info!.pageId).toBeUndefined();
    expect(ytProvider.setYt).toHaveBeenCalledWith('UC123', yt);
    expect(channelService.upsert).toHaveBeenCalledWith({ id: 'UC123', handle: '@test', name: 'Test Channel', thumbnail_url: 'https://img/photo.jpg' });
    expect(healthCheckService.markSessionValid).toHaveBeenCalled();
    expect(healthCheckService.markSessionExpired).not.toHaveBeenCalled();
  });

  it('should extract pageId and create new session for inactive channel', async () => {
    const ch = makeChannel({
      channel_handle: '@inactive',
      account_name: 'Inactive Channel',
      is_selected: false,
      supportedTokens: [{ pageIdToken: { pageId: 'PAGE_789' } }],
    });
    const yt = makeYt([ch], { '@inactive': 'UC456' });
    ytProvider.initYt.mockResolvedValueOnce(yt); // __main__ session

    await service.initialize();

    const info = service.getAccount('UC456');
    expect(info!.is_selected).toBe(false);
    expect(info!.pageId).toBe('PAGE_789');
    expect(ytProvider.initYt).toHaveBeenCalledWith('UC456', 'PAGE_789');
  });

  it('should log error and return when getInfo returns empty', async () => {
    const yt = makeYt([]);
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();

    expect(Array.from(service.accounts)).toHaveLength(0);
    expect(service.isInitialized).toBe(false);
    expect(ytProvider.setYt).not.toHaveBeenCalled();
    expect(healthCheckService.markSessionExpired).toHaveBeenCalled();
    expect(healthCheckService.markSessionValid).not.toHaveBeenCalled();
  });

  it('should log error and return when getInfo throws', async () => {
    const yt = {
      account: {
        getInfo: jest.fn().mockRejectedValue(new Error('API error')),
      },
    };
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();

    expect(Array.from(service.accounts)).toHaveLength(0);
    expect(service.isInitialized).toBe(false);
  });

  it('should retry per channel up to accountInitRetries', async () => {
    channelService.upsert
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);

    const ch = makeChannel({ channel_handle: '@err', account_name: 'Err' });
    const yt = makeYt([ch], { '@err': 'UCerr' });
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();

    expect(channelService.upsert).toHaveBeenCalledTimes(3);
    expect(service.getAccount('UCerr')).toBeDefined();
  });

  it('should skip channel after exhausting retries', async () => {
    channelService.upsert.mockRejectedValue(new Error('persistent fail'));

    const ch = makeChannel({ channel_handle: '@dead', account_name: 'Dead' });
    const yt = makeYt([ch], { '@dead': 'UCdead' });
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();

    expect(channelService.upsert).toHaveBeenCalledTimes(3);
    const entries = Array.from(service.accounts);
    expect(entries).toHaveLength(0);
  });

  it('should push account.list via SSE after init', async () => {
    const ch = makeChannel({ channel_handle: '@test', account_name: 'Test' });
    const yt = makeYt([ch], { '@test': 'UC123' });
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();

    expect(sseService.push).toHaveBeenCalledWith('account.list', {
      items: [{ id: 'UC123', handle: '@test', name: 'Test', thumbnail_url: undefined, is_selected: true, is_disabled: false, pageId: undefined }],
    });
  });

  it('should initialize only once', async () => {
    const ch = makeChannel({ channel_handle: '@a', account_name: 'A' });
    const yt = makeYt([ch], { '@a': 'UC1' });
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();
    await service.initialize();

    expect(ytProvider.initYt).toHaveBeenCalledTimes(1);
  });

  it('should reset on cookie changed event', async () => {
    const ch = makeChannel({ channel_handle: '@a', account_name: 'A' });
    const yt = makeYt([ch], { '@a': 'UC1' });
    ytProvider.initYt.mockResolvedValueOnce(yt);

    await service.initialize();
    expect(service.isInitialized).toBe(true);
    expect(Array.from(service.accounts)).toHaveLength(1);

    cookieService.emit('changed');

    expect(service.isInitialized).toBe(false);
    expect(Array.from(service.accounts)).toHaveLength(0);
  });
});
