import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../db/post.entity';
import { PostController } from './post.controller';
import { PostRepo } from './post.repo';
import { PostService } from './post.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
  ],
  controllers: [PostController],
  providers: [
    PostRepo,
    PostService,
  ],
  exports: [
    PostRepo,
    PostService,
  ],
})
export class PostModule { }
