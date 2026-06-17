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
      post_id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv',
      channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg',
      created_at: 1781516553,
    });
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      {
        post_id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv',
        channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg',
        created_at: 1781516553,
      },
      { conflictPaths: ['post_id'] },
    );
  });
});
