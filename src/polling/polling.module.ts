import { Global, Module } from '@nestjs/common';
import { PollingService } from './polling.service';

@Global()
@Module({
  providers: [
    PollingService,
  ],
  exports: [
    PollingService,
  ],
})
export class PollingModule { }
