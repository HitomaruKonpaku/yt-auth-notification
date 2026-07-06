import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { PostRepo } from './post.repo';
import { PostService } from './post.service';

@Controller('api/posts')
export class PostController {
  constructor(
    private readonly repo: PostRepo,
    private readonly service: PostService,
  ) { }

  @Post('fetch')
  async fetchPosts(@Body() body: { channel_id: string; owner_id?: string }) {
    const { channel_id, owner_id } = body;
    if (!channel_id || typeof channel_id !== 'string') {
      throw new BadRequestException('channel_id is required');
    }
    return this.service.fetchCommunityPosts(channel_id, owner_id);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    const post = await this.repo.findById(id);
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }
}
