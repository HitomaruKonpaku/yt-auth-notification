import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FetchPostsRequestDto {
  @ApiProperty({ description: 'YouTube channel ID to fetch posts for' })
  channel_id: string;

  @ApiPropertyOptional({ description: 'Owner account ID (defaults to selected account)' })
  owner_id?: string;
}

export class FetchPostsResponseDto {
  @ApiProperty({ description: 'Total posts found in feed' })
  total: number;

  @ApiProperty({ description: 'Number of new posts inserted' })
  inserted: number;

  @ApiProperty({ description: 'Number of existing posts updated' })
  updated: number;
}

export class PostDto {
  @ApiProperty({ description: 'Community post ID', example: 'Ugk...' })
  id: string;

  @ApiPropertyOptional({ description: 'Row creation timestamp (epoch ms)' })
  created_at?: number;

  @ApiPropertyOptional({ description: 'Row update timestamp (epoch ms)' })
  updated_at?: number;

  @ApiProperty({ description: 'YouTube channel ID this post belongs to' })
  channel_id: string;

  @ApiPropertyOptional({ description: 'Last fetch timestamp (epoch ms)' })
  fetched_at?: number;

  @ApiPropertyOptional({ description: 'Published timestamp (epoch ms)' })
  published_at?: number;

  @ApiPropertyOptional({ description: 'How the post was first discovered (notification|tab)' })
  initiator?: string;

  @ApiPropertyOptional({ description: 'Post type (BackstagePost|SharedPost)' })
  type?: string;

  @ApiPropertyOptional({ description: 'Post content (JSON)' })
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Post attachment (JSON)' })
  attachment?: Record<string, any>;
}
