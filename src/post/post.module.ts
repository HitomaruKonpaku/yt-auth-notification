import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../db/post.entity';
import { PostHistory } from '../db/post-history.entity';
import { PostController } from './post.controller';
import { PostHistoryRepo } from './post-history.repo';
import { PostRepo } from './post.repo';
import { PostService } from './post.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostHistory]),
  ],
  controllers: [PostController],
  providers: [
    PostRepo,
    PostHistoryRepo,
    PostService,
  ],
  exports: [
    PostRepo,
    PostHistoryRepo,
    PostService,
  ],
})
export class PostModule { }
