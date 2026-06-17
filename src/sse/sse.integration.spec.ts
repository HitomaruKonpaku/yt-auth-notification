import { Test, TestingModule } from '@nestjs/testing';
import { SseModule } from './sse.module';
import { SseService } from './sse.service';

describe('SseService integration', () => {
  let service: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SseModule],
    }).compile();
    service = module.get<SseService>(SseService);
  });

  it('should be injectable from SseModule', () => {
    expect(service).toBeDefined();
    expect(service.subject).toBeDefined();
  });

  it('should emit events to subscribers', (done) => {
    const events: any[] = [];
    service.subject.subscribe({
      next: (msg) => events.push(msg),
      complete: () => {
        expect(events).toHaveLength(2);
        expect(events[0].data).toEqual({ type: 'a', data: { x: 1 } });
        expect(events[1].data).toEqual({ type: 'b', data: { x: 2 } });
        done();
      },
    });

    service.push('a', { x: 1 });
    service.push('b', { x: 2 });
    service.subject.complete();
  });
});
