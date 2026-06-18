import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRepo } from './notification.repo';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../db/notification.entity';

describe('NotificationRepo', () => {
  let repo: NotificationRepo;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      count: jest.fn(),
      upsert: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepo,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
      ],
    }).compile();

    repo = module.get<NotificationRepo>(NotificationRepo);
  });

  it('should find existing IDs in bulk', async () => {
    mockRepo.find.mockResolvedValue([{ id: 'a' }, { id: 'c' }]);
    const result = await repo.findExistingIds(['a', 'b', 'c']);
    expect(result).toEqual(new Set(['a', 'c']));
    expect(mockRepo.find).toHaveBeenCalledWith({ select: { id: true }, where: { id: expect.any(Object) } });
  });

  it('should return empty set for empty input', async () => {
    const result = await repo.findExistingIds([]);
    expect(result).toEqual(new Set());
    expect(mockRepo.find).not.toHaveBeenCalled();
  });

  it('should find all ordered by sent_at desc', async () => {
    mockRepo.find.mockResolvedValue([{ id: '2' }, { id: '1' }]);
    const result = await repo.findAll({ limit: 10, offset: 0 });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('2');
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: {},
      order: { sent_at: 'DESC' },
      skip: 0,
      take: 10,
    });
  });

  it('should count total rows', async () => {
    mockRepo.count.mockResolvedValue(42);
    expect(await repo.count()).toBe(42);
  });

  it('should upsert all rows and return only new IDs', async () => {
    mockRepo.find.mockResolvedValue([{ id: 'a' }]); // 'a' exists, 'b' is new

    const result = await repo.upsertAll([
      { id: 'a', created_at: 1, sent_at: 1, short_message: { text: 'old', rtl: false } } as any,
      { id: 'b', created_at: 2, sent_at: 2, short_message: { text: 'new', rtl: false } } as any,
    ]);

    expect(result).toEqual(['b']); // only 'b' is new
    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    expect(mockRepo.upsert).toHaveBeenCalledTimes(1);
    expect(mockRepo.upsert).toHaveBeenCalledWith(expect.any(Array), {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    });
  });

  it('should return all IDs as new when no existing rows', async () => {
    mockRepo.find.mockResolvedValue([]);
    const result = await repo.upsertAll([
      { id: 'x', created_at: 1, sent_at: 1, short_message: { text: '', rtl: false } } as any,
      { id: 'y', created_at: 2, sent_at: 2, short_message: { text: '', rtl: false } } as any,
    ]);
    expect(result).toEqual(['x', 'y']);
  });

  it('should return empty array for empty input', async () => {
    const result = await repo.upsertAll([]);
    expect(result).toEqual([]);
    expect(mockRepo.find).not.toHaveBeenCalled();
    expect(mockRepo.upsert).not.toHaveBeenCalled();
  });
});
