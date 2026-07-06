import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FetchPostsRequestDto, FetchPostsResponseDto, PostDto } from './dto/post.dto';
import { PostRepo } from './post.repo';
import { PostService } from './post.service';

@ApiTags('posts')
@Controller('api/posts')
export class PostController {
  constructor(
    private readonly repo: PostRepo,
    private readonly service: PostService,
  ) { }

  @Post('fetch')
  @ApiOperation({ summary: 'Fetch community posts for a channel' })
  @ApiBody({ type: FetchPostsRequestDto })
  @ApiOkResponse({ description: 'Fetch results', type: FetchPostsResponseDto })
  async fetchPosts(@Body() body: FetchPostsRequestDto): Promise<FetchPostsResponseDto> {
    const { channel_id, owner_id } = body;
    if (!channel_id || typeof channel_id !== 'string') {
      throw new BadRequestException('channel_id is required');
    }
    return this.service.fetchCommunityPosts(channel_id, owner_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Community post ID' })
  @ApiOkResponse({ description: 'Post details', type: PostDto })
  async getPost(@Param('id') id: string): Promise<PostDto> {
    const post = await this.repo.findById(id);
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }
}
