import { Global, Module } from '@nestjs/common';
import { HealthCheckController } from './healthcheck.controller';
import { HealthCheckService } from './healthcheck.service';

@Global()
@Module({
  providers: [HealthCheckService],
  controllers: [HealthCheckController],
  exports: [HealthCheckService],
})
export class HealthCheckModule {}
