import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../db/post.entity';
import { PostRepo } from './post.repo';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
  ],
  providers: [
    PostRepo,
  ],
  exports: [
    PostRepo,
  ],
})
export class PostModule { }
