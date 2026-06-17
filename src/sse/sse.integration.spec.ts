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
        expect(events[0].event).toBe('a');
        expect(events[1].event).toBe('b');
        done();
      },
    });

    service.push('a', 1);
    service.push('b', 2);
    service.subject.complete();
  });
});
