import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

@Controller()
export class SseController {
  constructor(private readonly sseService: SseService) { }

  @Sse('sse')
  stream(): Observable<MessageEvent> {
    return this.sseService.subject.asObservable();
  }
}
