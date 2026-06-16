import { Test, TestingModule } from '@nestjs/testing';
import { CookieService } from './cookie.service';

// mock fs.watchFile via jest.mock (factory is hoisted — use jest.fn() inline)
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, watchFile: jest.fn() };
});

describe('CookieService', () => {
  let service: CookieService;

  // Helper to get the mocked watchFile reference
  const mockWatchFile = () => require('fs').watchFile as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.COOKIE_FILE = '/tmp/cookies.txt';
  });

  afterEach(() => {
    delete process.env.COOKIE_FILE;
  });

  it('should extend EventEmitter', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
    expect(service).toBeInstanceOf(require('events').EventEmitter);
  });

  it('should call fs.watchFile with 30s interval when COOKIE_FILE is set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
    expect(mockWatchFile()).toHaveBeenCalledWith(
      '/tmp/cookies.txt',
      { interval: 30000 },
      expect.any(Function),
    );
  });

  it('should emit "changed" when watchFile callback fires', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);

    const changedSpy = jest.fn();
    service.on('changed', changedSpy);

    // Get the callback passed to watchFile
    const watchCallback = mockWatchFile().mock.calls[0][2];
    watchCallback();

    expect(changedSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call fs.watchFile when COOKIE_FILE is not set', async () => {
    delete process.env.COOKIE_FILE;
    mockWatchFile().mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
    expect(mockWatchFile()).not.toHaveBeenCalled();
  });
});
