import { Test, TestingModule } from '@nestjs/testing';
import { DisplayController } from './display.controller';

describe('DisplayController', () => {
  let controller: DisplayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisplayController],
    }).compile();
    controller = module.get<DisplayController>(DisplayController);
  });

  it('GET / should return HTML', () => {
    const res = { type: jest.fn().mockReturnValue({ send: jest.fn() }) };
    controller.index(res as any);
    expect(res.type).toHaveBeenCalledWith('html');
  });
});
