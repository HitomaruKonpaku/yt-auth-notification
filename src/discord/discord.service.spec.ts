import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { DiscordService } from './discord.service';
import { ConfigService } from '../config/config.service';
import { AccountService } from '../account/account.service';
import { ChannelService } from '../channel/channel.service';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('DiscordService', () => {
  let service: DiscordService;
  let configService: { getConfig: jest.Mock };
  let accountService: { getAccount: jest.Mock };
  let channelService: { findById: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    configService = {
      getConfig: jest.fn().mockReturnValue({
        webhooks: {
          discord: [
            { url: 'https://discord.com/api/webhooks/1', msg: '<@123>' },
            { url: 'https://discord.com/api/webhooks/2', msg: '' },
          ],
        },
      }),
    };
    accountService = { getAccount: jest.fn().mockReturnValue(undefined) };
    channelService = { findById: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        { provide: ConfigService, useValue: configService },
        { provide: AccountService, useValue: accountService },
        { provide: ChannelService, useValue: channelService },
      ],
    }).compile();
    service = module.get<DiscordService>(DiscordService);
  });

  it('should send embed to all configured webhooks', async () => {
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1781444560063061',
      short_message: { text: 'Test msg', rtl: false },
      thumbnail_url: 'https://img.jpg',
      sent_at: 1781444560063,
      video_id: 'vid123',
      linked_comment_id: null,
      endpoint_url: '/watch?v=vid123',
    } as any);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.content).toBe('<@123>');
    expect(body.embeds[0].author.name).toBe('Test msg');
    expect(body.embeds[0].author.icon_url).toBe('https://img.jpg');
    expect(body.embeds[0].thumbnail.url).toBe('https://i.ytimg.com/vi/vid123/default.jpg');
  });

  it('should use comment URL when linked_comment_id present', async () => {
    mockAxios.post.mockResolvedValue({} as any);
    await service.relayNotification({
      id: '1', short_message: { text: 'x', rtl: false }, thumbnail_url: null,
      sent_at: 1, video_id: 'vid', linked_comment_id: 'lc456', endpoint_url: '/watch?v=vid',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].description).toBe('x\nhttps://youtube.com/watch?v=vid&lc=lc456');
  });

  it('should skip webhooks that fail and continue', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({} as any);
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('should omit content when msg is empty', async () => {
    configService.getConfig.mockReturnValue({ webhooks: { discord: [{ url: 'https://x.com', msg: '' }] } });
    mockAxios.post.mockResolvedValue({} as any);
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.content).toBeUndefined();
  });

  it('should omit thumbnail when no video_id', async () => {
    mockAxios.post.mockResolvedValue({} as any);
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].thumbnail).toBeUndefined();
  });

  // --- Footer tests ---

  it('should add footer from AccountService when owner_id present', async () => {
    accountService.getAccount.mockReturnValue({
      handle: '@nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: 'https://yt3.ggpht.com/photo.jpg',
    });
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1',
      short_message: { text: 'live msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC123',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toEqual({
      text: '@nakiriayame',
      icon_url: 'https://yt3.ggpht.com/photo.jpg',
    });
  });

  it('should add footer from ChannelService fallback when account not found', async () => {
    accountService.getAccount.mockReturnValue(undefined);
    channelService.findById.mockResolvedValue({
      id: 'UC123',
      handle: '@nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: 'https://yt3.ggpht.com/photo.jpg',
    });
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1',
      short_message: { text: 'live msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC123',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toEqual({
      text: '@nakiriayame',
      icon_url: 'https://yt3.ggpht.com/photo.jpg',
    });
  });

  it('should omit footer icon_url when channel has no thumbnail', async () => {
    accountService.getAccount.mockReturnValue({
      handle: '@nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: undefined,
    });
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1',
      short_message: { text: 'live msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC123',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toEqual({ text: '@nakiriayame' });
  });

  it('should not add footer when owner_id is absent', async () => {
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1',
      short_message: { text: 'msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should not add footer when neither source has handle', async () => {
    accountService.getAccount.mockReturnValue(undefined);
    channelService.findById.mockResolvedValue(null);
    mockAxios.post.mockResolvedValue({} as any);

    await service.relayNotification({
      id: '1',
      short_message: { text: 'msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC999',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should skip footer when AccountService.getAccount throws', async () => {
    accountService.getAccount.mockImplementation(() => {
      throw new Error('boom');
    });
    mockAxios.post.mockResolvedValue({} as any);

    // should not throw
    await service.relayNotification({
      id: '1',
      short_message: { text: 'msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC123',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should skip footer when ChannelService.findById throws', async () => {
    accountService.getAccount.mockReturnValue(undefined);
    channelService.findById.mockRejectedValue(new Error('db down'));
    mockAxios.post.mockResolvedValue({} as any);

    // should not throw
    await service.relayNotification({
      id: '1',
      short_message: { text: 'msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
      owner_id: 'UC123',
    } as any);

    const body = mockAxios.post.mock.calls[0][1] as any;
    expect(body.embeds[0].footer).toBeUndefined();
  });
});
