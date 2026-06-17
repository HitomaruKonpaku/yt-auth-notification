import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { SseEvent } from './sse.interface';

@Injectable()
export class SseService {
  readonly subject = new Subject<SseEvent>();

  constructor() {
    // ponytail: keepalive ping prevents Cloudflare/nginx from closing idle SSE stream
    setInterval(() => {
      this.subject.next({ event: 'ping', data: '' });
    }, 30000);
  }

  push(event: string, data: unknown) {
    this.subject.next({ event, data });
  }
}
