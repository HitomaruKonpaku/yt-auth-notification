import { Global, Module } from '@nestjs/common';
import { DisplayController } from './display.controller';
import { NotificationModule } from '../notification/notification.module';

@Global()
@Module({
  imports: [
    NotificationModule,
  ],
  controllers: [
    DisplayController,
  ],
})
export class DisplayModule { }
