import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionStatusDto } from './dto/healthcheck.dto';
import { HealthCheckService } from './healthcheck.service';

@ApiTags('healthcheck')
@Controller('api/healthcheck')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get('session')
  @ApiOperation({ summary: 'Get YouTube session status' })
  @ApiOkResponse({ description: 'Session expiration status', type: SessionStatusDto })
  session(): SessionStatusDto {
    return this.healthCheckService.getSessionStatus();
  }
}
