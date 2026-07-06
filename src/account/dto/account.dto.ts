import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountDto {
  @ApiProperty({ description: 'YouTube channel ID', example: 'UC...' })
  id: string;

  @ApiProperty({ description: 'Channel handle', example: '@channel' })
  handle: string;

  @ApiProperty({ description: 'Channel display name', example: 'Channel Name' })
  name: string;

  @ApiPropertyOptional({ description: 'Channel avatar thumbnail URL' })
  thumbnail_url?: string;

  @ApiProperty({ description: 'Whether this is the currently selected account' })
  is_selected: boolean;

  @ApiProperty({ description: 'Whether this account is disabled' })
  is_disabled: boolean;

  @ApiPropertyOptional({ description: 'Innertube page ID for session routing' })
  pageId?: string;
}
