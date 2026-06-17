import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
  });

  it('should emit pushed events on the subject', (done) => {
    service.subject.subscribe({
      next: (msg) => {
        expect(msg.event).toBe('test.event');
        expect(msg.data).toEqual({ foo: 'bar' });
        done();
      },
    });

    service.push('test.event', { foo: 'bar' });
  });

  it('should handle null/undefined data', (done) => {
    service.subject.subscribe({
      next: (msg) => {
        expect(msg.event).toBe('empty');
        expect(msg.data).toBeNull();
        done();
      },
    });

    service.push('empty', null);
  });
});
