import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from './healthcheck.service';
import { AccountService } from '../account/account.service';
import { ConfigService } from '../config/config.service';
import { SseService } from '../sse/sse.service';
import { YTProvider } from '../youtube/yt.provider';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let sseService: { push: jest.Mock };
  let configService: { getConfig: jest.Mock };
  let accountService: { getAccounts: jest.Mock };
  let ytProvider: { getYt: jest.Mock };
  let schedulerRegistry: { addInterval: jest.Mock };

  beforeEach(async () => {
    sseService = { push: jest.fn() };
    configService = { getConfig: jest.fn().mockReturnValue({ healthCheckIntervalMs: 1800000 }) };
    accountService = { getAccounts: jest.fn().mockReturnValue([]) };
    ytProvider = { getYt: jest.fn() };
    schedulerRegistry = { addInterval: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        { provide: ConfigService, useValue: configService },
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: AccountService, useValue: accountService },
        { provide: YTProvider, useValue: ytProvider },
        { provide: SseService, useValue: sseService },
      ],
    }).compile();
    service = module.get<HealthCheckService>(HealthCheckService);
  });

  describe('getSessionStatus', () => {
    it('should return expired=false', () => {
      expect(service.getSessionStatus()).toEqual({ expired: false });
    });

    it('should return expired=true', () => {
      service.sessionExpired = true;
      expect(service.getSessionStatus()).toEqual({ expired: true });
    });
  });

  describe('markSessionValid', () => {
    it('should set sessionExpired to false', () => {
      service.sessionExpired = true;
      service.markSessionValid();
      expect(service.sessionExpired).toBe(false);
    });
  });

  describe('markSessionExpired', () => {
    it('should set sessionExpired to true and push SSE event', () => {
      service.markSessionExpired();
      expect(service.sessionExpired).toBe(true);
      expect(sseService.push).toHaveBeenCalledWith('session.expired', {});
    });
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should register interval when config > 0', () => {
      service.onModuleInit();
      expect(schedulerRegistry.addInterval).toHaveBeenCalledWith('health-check', expect.any(Object));
    });

    it('should not register interval when config is 0', async () => {
      const addInterval = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthCheckService,
          { provide: ConfigService, useValue: { getConfig: jest.fn().mockReturnValue({ healthCheckIntervalMs: 0 }) } },
          { provide: SchedulerRegistry, useValue: { addInterval } },
          { provide: AccountService, useValue: accountService },
          { provide: YTProvider, useValue: ytProvider },
          { provide: SseService, useValue: sseService },
        ],
      }).compile();
      module.get<HealthCheckService>(HealthCheckService);
      expect(addInterval).not.toHaveBeenCalled();
    });

    it('should not register interval when config is negative', async () => {
      const addInterval = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthCheckService,
          { provide: ConfigService, useValue: { getConfig: jest.fn().mockReturnValue({ healthCheckIntervalMs: -1 }) } },
          { provide: SchedulerRegistry, useValue: { addInterval } },
          { provide: AccountService, useValue: accountService },
          { provide: YTProvider, useValue: ytProvider },
          { provide: SseService, useValue: sseService },
        ],
      }).compile();
      module.get<HealthCheckService>(HealthCheckService);
      expect(addInterval).not.toHaveBeenCalled();
    });
  });

  describe('tick', () => {
    it('should skip when no selected account', async () => {
      accountService.getAccounts.mockReturnValue([]);
      await service.tick();
      expect(sseService.push).not.toHaveBeenCalled();
    });

    it('should skip when no cached yt session for selected account', async () => {
      accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
      ytProvider.getYt.mockReturnValue(undefined);
      await service.tick();
      expect(sseService.push).not.toHaveBeenCalled();
    });

    it('should set sessionExpired and push SSE on matching error', async () => {
      const getInfo = jest.fn().mockRejectedValue({ version: '1', message: 'Page contents not found' });
      accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
      ytProvider.getYt.mockReturnValue({ account: { getInfo } });

      await service.tick();

      expect(service.sessionExpired).toBe(true);
      expect(sseService.push).toHaveBeenCalledWith('session.expired', {});
    });

    it('should not push SSE on non-matching error', async () => {
      const getInfo = jest.fn().mockRejectedValue(new Error('Network error'));
      accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
      ytProvider.getYt.mockReturnValue({ account: { getInfo } });
      service.sessionExpired = true;

      await service.tick();

      expect(service.sessionExpired).toBe(true); // unchanged
      expect(sseService.push).not.toHaveBeenCalled();
    });

    it('should set sessionExpired=false on successful getInfo', async () => {
      const getInfo = jest.fn().mockResolvedValue(undefined);
      accountService.getAccounts.mockReturnValue([{ id: 'UC1', is_selected: true }]);
      ytProvider.getYt.mockReturnValue({ account: { getInfo } });
      service.sessionExpired = true;

      await service.tick();

      expect(service.sessionExpired).toBe(false);
    });
  });
});
