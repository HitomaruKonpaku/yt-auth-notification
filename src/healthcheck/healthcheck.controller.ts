import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './healthcheck.service';

@Controller('/api/healthcheck')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get('/session')
  session() {
    return this.healthCheckService.getSessionStatus();
  }
}
