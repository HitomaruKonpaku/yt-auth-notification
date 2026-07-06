import { ApiProperty } from '@nestjs/swagger';

export class SessionStatusDto {
  @ApiProperty({ description: 'Whether the YouTube session has expired' })
  expired: boolean;
}
