import { Test, TestingModule } from '@nestjs/testing';
import { PostRepo } from './post.repo';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../db/post.entity';

describe('PostRepo', () => {
  let repo: PostRepo;
  let mockRepo: any;

  let mockQb: any;

  beforeEach(async () => {
    mockQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockRepo = {
      upsert: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostRepo,
        { provide: getRepositoryToken(Post), useValue: mockRepo },
      ],
    }).compile();

    repo = module.get<PostRepo>(PostRepo);
  });

  it('should upsert a post row', async () => {
    await repo.upsert({
      id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv',
      channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg',
      created_at: 1781516553,
    });
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      {
        id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv',
        channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg',
        created_at: 1781516553,
      },
      { conflictPaths: ['id'] },
    );
  });

  it('should return empty array for empty ids', async () => {
    const result = await repo.findToFetch([], 30 * 60 * 1000);
    expect(result).toEqual([]);
    expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('should filter by fetched_at staleness', async () => {
    mockQb.getMany.mockResolvedValue([{ id: 'p1', channel_id: 'c1', created_at: 123 }]);

    const result = await repo.findToFetch(['p1', 'p2'], 30 * 60 * 1000);

    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('post');
    expect(mockQb.select).toHaveBeenCalledWith(['post.id', 'post.channel_id', 'post.created_at']);
    expect(mockQb.andWhere).toHaveBeenCalledWith('post.id IN (:...ids)', { ids: ['p1', 'p2'] });
    expect(mockQb.getMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'p1', channel_id: 'c1', created_at: 123 }]);
  });

  it('should update a post row by id', async () => {
    await repo.update('p1', { fetched_at: 123456, updated_at: 123456 });

    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { fetched_at: 123456, updated_at: 123456 },
    );
  });
});
