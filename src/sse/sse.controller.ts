import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

@ApiTags('sse')
@Controller()
export class SseController {
  constructor(private readonly sseService: SseService) { }

  @Sse('sse')
  stream(): Observable<MessageEvent> {
    return this.sseService.subject.asObservable();
  }
}
