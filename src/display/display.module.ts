import { Global, Module } from '@nestjs/common';
import { DisplayController } from './display.controller';

@Global()
@Module({
  controllers: [DisplayController],
})
export class DisplayModule { }
