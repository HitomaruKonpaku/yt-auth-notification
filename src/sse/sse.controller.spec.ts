import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { Subject } from 'rxjs';

describe('SseController', () => {
  let controller: SseController;
  let sseService: { subject: Subject<any> };

  beforeEach(async () => {
    sseService = { subject: new Subject() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [{ provide: SseService, useValue: sseService }],
    }).compile();
    controller = module.get<SseController>(SseController);
  });

  it('should return the SseService subject as observable', () => {
    const result = controller.stream();
    expect(result).toBeDefined();
    expect(typeof (result as any).subscribe).toBe('function');
  });
});
