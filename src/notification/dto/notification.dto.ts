import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ description: 'Notification ID', example: 'Ugk...' })
  id: string;

  @ApiPropertyOptional({ description: 'Row creation timestamp (epoch ms)' })
  created_at?: number;

  @ApiProperty({ description: 'Notification sent timestamp (derived from ID)', example: 1720000000000 })
  sent_at: number;

  @ApiPropertyOptional({ description: 'YouTube channel ID that owns this notification' })
  owner_id?: string;

  @ApiPropertyOptional({ description: 'Related video ID' })
  video_id?: string;

  @ApiPropertyOptional({ description: 'Related community post ID' })
  post_id?: string;

  @ApiPropertyOptional({ description: 'Related comment ID' })
  linked_comment_id?: string;

  @ApiPropertyOptional({ description: 'YouTube endpoint URL' })
  endpoint_url?: string;

  @ApiProperty({ description: 'Notification message', example: 'Channel A uploaded: Video' })
  message: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: 'Constructed YouTube URL for the notification target', type: 'string', nullable: true })
  _url?: string | null;
}

export class LatestNotificationDto {
  @ApiProperty({ description: 'Most recent notification, or null if none', type: NotificationDto, nullable: true })
  item: NotificationDto | null;
}
