import { Test, TestingModule } from '@nestjs/testing';
import { DiscordService } from './discord.service';
import { ConfigService } from '../config/config.service';

global.fetch = jest.fn();

describe('DiscordService', () => {
  let service: DiscordService;
  let configService: { getConfig: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscordService, { provide: ConfigService, useValue: configService }],
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
    expect(body.embeds[0].description).toBe('https://youtube.com/watch?v=vid&lc=lc456');
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
});
