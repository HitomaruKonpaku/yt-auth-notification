import { Test, TestingModule } from '@nestjs/testing';
import { PostRepo } from './post.repo';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../db/post.entity';

describe('PostRepo', () => {
  let repo: PostRepo;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      upsert: jest.fn(),
      find: jest.fn(),
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

  it('should update a post row by id', async () => {
    await repo.update('p1', { fetched_at: 123456, updated_at: 123456 });

    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { fetched_at: 123456, updated_at: 123456 },
    );
  });
});
