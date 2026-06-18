import { Global, Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { PollingService } from './polling.service';

@Global()
@Module({
  imports: [AccountModule],
  providers: [PollingService],
  exports: [PollingService],
})
export class PollingModule { }
