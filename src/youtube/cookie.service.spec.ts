import { Test, TestingModule } from '@nestjs/testing';
import { CookieService } from './cookie.service';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    watch: jest.fn(),
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue(
      '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tFALSE\t0\tSAPISID\tval1\n.youtube.com\tTRUE\t/\tFALSE\t0\tHSID\tval2\n',
    ),
  };
});

describe('CookieService', () => {
  let service: CookieService;

  const mockWatch = () => require('fs').watch as jest.Mock;

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

  it('should call fs.watch when COOKIE_FILE is set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
    expect(mockWatch()).toHaveBeenCalledWith(
      '/tmp/cookies.txt',
      expect.any(Function),
    );
  });

  it('should emit "changed" when watch callback fires with change event', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);

    const changedSpy = jest.fn();
    service.on('changed', changedSpy);

    const watchCallback = mockWatch().mock.calls[0][1];
    watchCallback('change');

    expect(changedSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit "changed" for non-change events', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);

    const changedSpy = jest.fn();
    service.on('changed', changedSpy);

    const watchCallback = mockWatch().mock.calls[0][1];
    watchCallback('rename');

    expect(changedSpy).not.toHaveBeenCalled();
  });

  it('should not call fs.watch when COOKIE_FILE is not set', async () => {
    delete process.env.COOKIE_FILE;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
    expect(mockWatch()).not.toHaveBeenCalled();
  });

  it('should cache the cookie string and only read file once', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);

    const readFileSync = require('fs').readFileSync as jest.Mock;
    readFileSync.mockClear();

    const result1 = service.getCookieString();
    const result2 = service.getCookieString();

    expect(result1).toEqual(result2);
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache when cookie file changes', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);

    const readFileSync = require('fs').readFileSync as jest.Mock;
    readFileSync.mockClear();

    service.getCookieString();
    expect(readFileSync).toHaveBeenCalledTimes(1);

    const mockWatch = require('fs').watch as jest.Mock;
    const watchCallback = mockWatch.mock.calls[0][1];
    watchCallback('change');

    service.getCookieString();
    expect(readFileSync).toHaveBeenCalledTimes(2);
  });
});
