import { SseService } from './sse.service';
import { ConfigService } from '../config/config.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    jest.useFakeTimers();
    const configService = { getConfig: jest.fn().mockReturnValue({ sseKeepaliveMs: 30000 }) } as any;
    service = new SseService(configService);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('should emit keepalive ping at configured interval', () => {
    const spy = jest.fn();
    service.subject.subscribe({ next: spy });

    jest.advanceTimersByTime(30000);
    expect(spy).toHaveBeenCalledWith({ data: 'ping' });
  });
});
