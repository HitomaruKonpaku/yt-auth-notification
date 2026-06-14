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

  it('should check existence by id', async () => {
    mockRepo.count.mockResolvedValue(0);
    expect(await repo.exists('123')).toBe(false);
    mockRepo.count.mockResolvedValue(1);
    expect(await repo.exists('123')).toBe(true);
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
