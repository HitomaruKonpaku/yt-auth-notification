import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

describe('ChannelController', () => {
  let controller: ChannelController;
  let channelService: { getChannels: jest.Mock };

  beforeEach(async () => {
    channelService = { getChannels: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [{ provide: ChannelService, useValue: channelService }],
    }).compile();
    controller = module.get<ChannelController>(ChannelController);
  });

  it('GET /api/channels should return paginated result', async () => {
    channelService.getChannels.mockResolvedValue({
      total: 2,
      items: [{ id: 'UC1', handle: '@a', name: 'A' }, { id: 'UC2', handle: '@b', name: 'B' }],
    });

    const result = await controller.getChannels(10, 0);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('GET /api/channels should pass query params as numbers', async () => {
    channelService.getChannels.mockResolvedValue({ total: 0, items: [] });

    await controller.getChannels(25, 5);
    expect(channelService.getChannels).toHaveBeenCalledWith(25, 5);
  });
});
