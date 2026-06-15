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
      insert: jest.fn(),
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

  it('should insert a notification', async () => {
    const row = { id: '1', created_at: 1, sent_at: 1, short_message: { text: '', rtl: false } };
    await repo.insert(row);
    expect(mockRepo.insert).toHaveBeenCalledWith(row);
  });

  it('should find all ordered by sent_at desc', async () => {
    mockRepo.find.mockResolvedValue([{ id: '2' }, { id: '1' }]);
    const result = await repo.findAll({ limit: 10, offset: 0 });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('2');
    expect(mockRepo.find).toHaveBeenCalledWith({
      order: { sent_at: 'DESC' },
      skip: 0,
      take: 10,
    });
  });

  it('should count total rows', async () => {
    mockRepo.count.mockResolvedValue(42);
    expect(await repo.count()).toBe(42);
  });
});
