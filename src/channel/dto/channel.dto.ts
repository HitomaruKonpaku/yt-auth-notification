import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChannelDto {
  @ApiProperty({ description: 'YouTube channel ID', example: 'UC...' })
  id: string;

  @ApiPropertyOptional({ description: 'Row creation timestamp (epoch ms)' })
  created_at?: number;

  @ApiPropertyOptional({ description: 'Row update timestamp (epoch ms)' })
  updated_at?: number;

  @ApiPropertyOptional({ description: 'Channel handle (without @)', example: 'channel' })
  handle?: string;

  @ApiPropertyOptional({ description: 'Channel display name', example: 'Channel Name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Channel avatar thumbnail URL' })
  thumbnail_url?: string;
}

