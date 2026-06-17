import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { SseEvent } from './sse.interface';

@Injectable()
export class SseService {
  readonly subject = new Subject<SseEvent>();

  push(event: string, data: unknown) {
    this.subject.next({ event, data });
  }
}
