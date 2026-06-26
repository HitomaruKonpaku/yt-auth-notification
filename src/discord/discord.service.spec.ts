import { Test, TestingModule } from '@nestjs/testing';
import { DiscordService } from './discord.service';
import { ConfigService } from '../config/config.service';
import { AccountService } from '../account/account.service';
import { ChannelService } from '../channel/channel.service';

global.fetch = jest.fn();

describe('DiscordService', () => {
  let service: DiscordService;
  let configService: { getConfig: jest.Mock };
  let accountService: { get: jest.Mock };
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
    accountService = { get: jest.fn().mockReturnValue(undefined) };
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
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await service.relayNotification({
      id: '1781444560063061',
      short_message: { text: 'Test msg', rtl: false },
      thumbnail_url: 'https://img.jpg',
      sent_at: 1781444560063,
      video_id: 'vid123',
      linked_comment_id: null,
      endpoint_url: '/watch?v=vid123',
    } as any);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.content).toBe('<@123>');
    expect(body.embeds[0].author.name).toBe('Test msg');
    expect(body.embeds[0].author.icon_url).toBe('https://img.jpg');
    expect(body.embeds[0].thumbnail.url).toBe('https://i.ytimg.com/vi/vid123/default.jpg');
  });

  it('should use comment URL when linked_comment_id present', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await service.relayNotification({
      id: '1', short_message: { text: 'x', rtl: false }, thumbnail_url: null,
      sent_at: 1, video_id: 'vid', linked_comment_id: 'lc456', endpoint_url: '/watch?v=vid',
    } as any);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].description).toBe('x\nhttps://youtube.com/watch?v=vid&lc=lc456');
  });

  it('should skip webhooks that fail and continue', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({ ok: true });
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should omit content when msg is empty', async () => {
    configService.getConfig.mockReturnValue({ webhooks: { discord: [{ url: 'https://x.com', msg: '' }] } });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.content).toBeUndefined();
  });

  it('should omit thumbnail when no video_id', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await service.relayNotification({
      id: '1', short_message: { text: '', rtl: false }, thumbnail_url: null, sent_at: 1,
      video_id: null, linked_comment_id: null, endpoint_url: null,
    } as any);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].thumbnail).toBeUndefined();
  });

  // --- Footer tests ---

  it('should add footer from AccountService when owner_id present', async () => {
    accountService.get.mockReturnValue({
      handle: 'nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: 'https://yt3.ggpht.com/photo.jpg',
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toEqual({
      text: '@nakiriayame',
      icon_url: 'https://yt3.ggpht.com/photo.jpg',
    });
  });

  it('should add footer from ChannelService fallback when account not found', async () => {
    accountService.get.mockReturnValue(undefined);
    channelService.findById.mockResolvedValue({
      id: 'UC123',
      handle: 'nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: 'https://yt3.ggpht.com/photo.jpg',
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toEqual({
      text: '@nakiriayame',
      icon_url: 'https://yt3.ggpht.com/photo.jpg',
    });
  });

  it('should omit footer icon_url when channel has no thumbnail', async () => {
    accountService.get.mockReturnValue({
      handle: 'nakiriayame',
      name: 'Nakiri Ayame Ch.',
      thumbnail_url: undefined,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toEqual({ text: '@nakiriayame' });
  });

  it('should not add footer when owner_id is absent', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await service.relayNotification({
      id: '1',
      short_message: { text: 'msg', rtl: false },
      thumbnail_url: null,
      sent_at: 1,
      video_id: null,
      linked_comment_id: null,
      endpoint_url: null,
    } as any);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should not add footer when neither source has handle', async () => {
    accountService.get.mockReturnValue(undefined);
    channelService.findById.mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should skip footer when AccountService.get throws', async () => {
    accountService.get.mockImplementation(() => {
      throw new Error('boom');
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toBeUndefined();
  });

  it('should skip footer when ChannelService.findById throws', async () => {
    accountService.get.mockReturnValue(undefined);
    channelService.findById.mockRejectedValue(new Error('db down'));
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

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

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.embeds[0].footer).toBeUndefined();
  });
});
