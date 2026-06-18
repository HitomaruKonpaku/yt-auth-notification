import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { ChannelService } from '../channel/channel.service';
import { ConfigService } from '../config/config.service';

describe('AccountService', () => {
  let service: AccountService;
  let channelService: { upsert: jest.Mock };
  let configService: { getConfig: jest.Mock };

  const makeChannel = (opts: {
    channel_handle: string;
    account_name: string;
    is_selected?: boolean;
    account_photo?: { url: string }[];
    supportedTokens?: any[];
  }) => ({
    channel_handle: opts.channel_handle,
    account_name: opts.account_name,
    is_selected: opts.is_selected ?? true,
    account_photo: opts.account_photo ?? [],
    endpoint: opts.supportedTokens ? {
      payload: { supportedTokens: opts.supportedTokens },
    } : undefined,
  });

  const makeYt = (channels: any[], channelIdMap?: Record<string, string>) => ({
    account: {
      getInfo: jest.fn().mockResolvedValue({
        contents: { contents: channels },
      }),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: ChannelService, useValue: channelService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get<AccountService>(AccountService);
  });

  it('should discover and store active channel', async () => {
    const ch = makeChannel({
      channel_handle: '@test',
      account_name: 'Test Channel',
      account_photo: [{ url: 'https://img/photo.jpg' }],
    });
    const yt = makeYt([ch], { '@test': 'UC123' });

    await service.initialize(yt as any);

    const info = service.get('UC123');
    expect(info).toBeDefined();
    expect(info!.handle).toBe('@test');
    expect(info!.name).toBe('Test Channel');
    expect(info!.thumbnail_url).toBe('https://img/photo.jpg');
    expect(info!.pageId).toBeUndefined();
    expect(channelService.upsert).toHaveBeenCalledWith('UC123', '@test', 'Test Channel', 'https://img/photo.jpg');
  });

  it('should extract pageId for inactive channel', async () => {
    const ch = makeChannel({
      channel_handle: '@inactive',
      account_name: 'Inactive Channel',
      is_selected: false,
      supportedTokens: [{ pageIdToken: { pageId: 'PAGE_789' } }],
    });
    const yt = makeYt([ch], { '@inactive': 'UC456' });

    await service.initialize(yt as any);

    const info = service.get('UC456');
    expect(info!.pageId).toBe('PAGE_789');
  });

  it('should lock insertion order (null entries before patching)', async () => {
    const ch = makeChannel({ channel_handle: '@a', account_name: 'A' });
    const yt = makeYt([ch], { '@a': 'UC1' });

    await service.initialize(yt as any);

    // Entry should be AccountInfo (not null) after init
    const info = service.get('UC1');
    expect(info).not.toBeNull();
    expect(info!.handle).toBe('@a');
  });

  it('should retry per channel up to accountInitRetries', async () => {
    channelService.upsert
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);

    const ch = makeChannel({ channel_handle: '@err', account_name: 'Err' });
    const yt = makeYt([ch], { '@err': 'UCerr' });

    await service.initialize(yt as any);

    expect(channelService.upsert).toHaveBeenCalledTimes(3);
    expect(service.get('UCerr')).toBeDefined();
  });

  it('should skip channel after exhausting retries', async () => {
    channelService.upsert.mockRejectedValue(new Error('persistent fail'));

    const ch = makeChannel({ channel_handle: '@dead', account_name: 'Dead' });
    const yt = makeYt([ch], { '@dead': 'UCdead' });

    await service.initialize(yt as any);

    expect(channelService.upsert).toHaveBeenCalledTimes(3);
    // Entry stays null after all retries fail
    const entries = Array.from(service.accounts);
    expect(entries).toHaveLength(0); // null entries filtered out
  });

  it('should initialize only once', async () => {
    const ch = makeChannel({ channel_handle: '@a', account_name: 'A' });
    const yt = makeYt([ch], { '@a': 'UC1' });

    await service.initialize(yt as any);
    await service.initialize(yt as any);

    // getInfo called only once
    expect(yt.account.getInfo).toHaveBeenCalledTimes(1);
  });
});
