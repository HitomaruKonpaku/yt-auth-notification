import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService {
  readonly subject = new Subject<{ data: string | object }>();

  constructor() {
    // ponytail: keepalive ping prevents Cloudflare/nginx from closing idle SSE stream
    setInterval(() => {
      this.subject.next({ data: 'ping' });
    }, 30000);
  }

  push(type: string, data: unknown) {
    this.subject.next({ data: { type, data } });
  }
}
