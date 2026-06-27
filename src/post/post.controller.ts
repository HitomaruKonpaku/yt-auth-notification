import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PostRepo } from './post.repo';

@Controller('api')
export class PostController {
  constructor(private readonly repo: PostRepo) { }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    const post = await this.repo.findById(id);
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }
}
