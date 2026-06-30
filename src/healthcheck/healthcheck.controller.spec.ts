import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from './healthcheck.controller';
import { HealthCheckService } from './healthcheck.service';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let service: { getSessionStatus: jest.Mock };

  beforeEach(async () => {
    service = { getSessionStatus: jest.fn().mockReturnValue({ expired: false }) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [{ provide: HealthCheckService, useValue: service }],
    }).compile();
    controller = module.get<HealthCheckController>(HealthCheckController);
  });

  it('should return expired=false', () => {
    expect(controller.session()).toEqual({ expired: false });
    expect(service.getSessionStatus).toHaveBeenCalled();
  });

  it('should return expired=true', () => {
    service.getSessionStatus.mockReturnValue({ expired: true });
    expect(controller.session()).toEqual({ expired: true });
    expect(service.getSessionStatus).toHaveBeenCalled();
  });
});
