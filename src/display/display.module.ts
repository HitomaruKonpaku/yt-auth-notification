import { Global, Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { SseModule } from '../sse/sse.module';
import { DisplayController } from './display.controller';

@Global()
@Module({
  imports: [
    SseModule,
    NotificationModule,
  ],
  controllers: [
    DisplayController,
  ],
})
export class DisplayModule { }
