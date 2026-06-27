import { Test, TestingModule } from '@nestjs/testing';
import { ChannelRepo } from './channel.repo';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Channel } from '../db/channel.entity';

describe('ChannelRepo', () => {
  let repo: ChannelRepo;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      exists: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelRepo,
        { provide: getRepositoryToken(Channel), useValue: mockRepo },
      ],
    }).compile();

    repo = module.get<ChannelRepo>(ChannelRepo);
  });

  it('should check if channel exists by id', async () => {
    mockRepo.exists.mockResolvedValue(true);
    const result = await repo.exists('UC123');
    expect(result).toBe(true);
    expect(mockRepo.exists).toHaveBeenCalledWith({ where: { id: 'UC123' } });
  });

  it('should return false when channel does not exist', async () => {
    mockRepo.exists.mockResolvedValue(false);
    const result = await repo.exists('UC999');
    expect(result).toBe(false);
  });

  it('should find all channels with total count', async () => {
    const channels = [{ id: 'UC1', handle: '@a', name: 'A' }, { id: 'UC2', handle: '@b', name: 'B' }];
    mockRepo.findAndCount.mockResolvedValue([channels, 2]);
    const result = await repo.findAll({ limit: 10, offset: 0 });
    expect(result).toEqual({ items: channels, total: 2 });
    expect(mockRepo.findAndCount).toHaveBeenCalledWith({ order: { handle: 'ASC' }, skip: 0, take: 10 });
  });

  it('should find channel by id', async () => {
    const channel = { id: 'UC123', handle: '@test', name: 'Test' };
    mockRepo.findOne.mockResolvedValue(channel);
    const result = await repo.findById('UC123');
    expect(result).toBe(channel);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'UC123' } });
  });

  it('should return null when channel not found by id', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const result = await repo.findById('UC999');
    expect(result).toBeNull();
  });

  it('should upsert a channel row', async () => {
    await repo.upsert({ id: 'UC123', handle: '@test', name: 'Test Channel' });
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      { id: 'UC123', handle: '@test', name: 'Test Channel' },
      { conflictPaths: ['id'] },
    );
  });
});
