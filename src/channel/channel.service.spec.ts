import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { ChannelRepo } from './channel.repo';

describe('ChannelService', () => {
  let service: ChannelService;
  let repo: { upsert: jest.Mock; findById: jest.Mock; findAll: jest.Mock };

  beforeEach(async () => {
    repo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        { provide: ChannelRepo, useValue: repo },
      ],
    }).compile();
    service = module.get<ChannelService>(ChannelService);
  });

  it('should delegate getChannels to repo.findAll', async () => {
    const result = { items: [{ id: 'UC1', handle: '@a', name: 'A' }], total: 1 };
    repo.findAll.mockResolvedValue(result);
    const got = await service.getChannels(10, 0);
    expect(got).toBe(result);
    expect(repo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('should delegate findById to repo', async () => {
    const channel = { id: 'UC123', handle: '@test', name: 'Test' };
    repo.findById = jest.fn().mockResolvedValue(channel);
    const result = await service.findById('UC123');
    expect(result).toBe(channel);
    expect(repo.findById).toHaveBeenCalledWith('UC123');
  });

  it('should call repo.upsert with all fields', async () => {
    await service.upsert('UC123', '@test', 'Test Channel', 'img.jpg');
    expect(repo.upsert).toHaveBeenCalledWith({
      id: 'UC123',
      handle: '@test',
      name: 'Test Channel',
      thumbnail_url: 'img.jpg',
    });
  });

  it('should call repo.upsert without thumbnail_url when undefined', async () => {
    await service.upsert('UC123', '@test', 'Test Channel');
    expect(repo.upsert).toHaveBeenCalledWith({
      id: 'UC123',
      handle: '@test',
      name: 'Test Channel',
      thumbnail_url: undefined,
    });
  });

  it('should log error on upsert failure', async () => {
    repo.upsert.mockRejectedValue(new Error('fail'));
    await service.upsert('UCerr', '@err', 'Err');
    expect(repo.upsert).toHaveBeenCalledTimes(1);
  });
});
