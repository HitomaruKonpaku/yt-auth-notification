import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
  });

  it('should push { type, data } wrapped in MessageEvent data', (done) => {
    service.subject.subscribe({
      next: (msg) => {
        expect(msg.data).toEqual({ type: 'test.event', data: { foo: 'bar' } });
        done();
      },
    });

    service.push('test.event', { foo: 'bar' });
  });

  it('should handle null data', (done) => {
    service.subject.subscribe({
      next: (msg) => {
        expect(msg.data).toEqual({ type: 'empty', data: null });
        done();
      },
    });

    service.push('empty', null);
  });
});
