import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SseService {
  readonly subject = new Subject<{ data: string | object }>();

  constructor(private readonly configService: ConfigService) {
    const keepaliveMs = this.configService.getConfig().sseKeepaliveMs!;
    setInterval(() => {
      this.subject.next({ data: 'ping' });
    }, keepaliveMs);
  }

  push(type: string, data: unknown) {
    this.subject.next({ data: { type, data } });
  }
}
