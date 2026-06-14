import { Test, TestingModule } from '@nestjs/testing';
import { CookieService } from './cookie.service';
import * as fs from 'fs';
import { CookieJar } from 'netscape-cookies-parser';

jest.mock('fs');

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookieService],
    }).compile();
    service = module.get<CookieService>(CookieService);
  });

  describe('getCookieString', () => {
    it('should parse cookies and return semicolon-joined string', () => {
      process.env.COOKIE_FILE = '/fake/cookies.txt';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('# Netscape HTTP Cookie File\n.example.com\tTRUE\t/\tTRUE\t123\tNAME\tVALUE');

      // Spy on CookieJar constructor and parse method
      const mockParse = jest.spyOn(CookieJar.prototype, 'parse').mockReturnValue([
        { name: 'LOGIN_INFO', value: 'abc', domain: '.youtube.com' } as any,
        { name: 'SAPISID', value: 'xyz', domain: '.youtube.com' } as any,
      ]);

      const result = service.getCookieString();
      expect(result).toBe('LOGIN_INFO=abc; SAPISID=xyz');

      mockParse.mockRestore();
    });

    it('should throw if COOKIE_FILE env not set', () => {
      delete process.env.COOKIE_FILE;
      expect(() => service.getCookieString()).toThrow(/COOKIE_FILE/);
    });

    it('should throw if cookie file not found', () => {
      process.env.COOKIE_FILE = '/nonexistent.txt';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(() => service.getCookieString()).toThrow(/not found/);
    });

    it('should throw if no valid cookies parsed', () => {
      process.env.COOKIE_FILE = '/empty.txt';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('# empty');

      const mockParse = jest.spyOn(CookieJar.prototype, 'parse').mockReturnValue([]);

      expect(() => service.getCookieString()).toThrow(/No valid cookies/);

      mockParse.mockRestore();
    });
  });
});
