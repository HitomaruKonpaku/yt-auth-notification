import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

jest.mock('fs');
jest.mock('js-yaml');

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load a valid config file with all fields', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('fake yaml');
      (yaml.load as jest.Mock).mockReturnValue({
        interval: 120,
        webhooks: { discord: [{ url: 'https://discord.com/test', msg: '<@123>' }] },
      });

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.interval).toBe(120);
      expect(config.webhooks!.discord!).toHaveLength(1);
      expect(config.webhooks!.discord![0].url).toBe('https://discord.com/test');
    });

    it('should apply defaults when top-level keys are missing', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('empty');
      (yaml.load as jest.Mock).mockReturnValue({});

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.interval).toBe(60);
      expect(config.webhooks!.discord!).toEqual([]);
    });

    it('should skip webhook entries with missing or empty url', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('yaml');
      (yaml.load as jest.Mock).mockReturnValue({
        webhooks: {
          discord: [
            { url: '' },
            { msg: 'no url here' },
            { url: 'https://valid.com' },
          ],
        },
      });

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.webhooks!.discord!).toHaveLength(1);
      expect(config.webhooks!.discord![0].url).toBe('https://valid.com');
    });

    it('should throw when config file is missing', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => new ConfigService()).toThrow(/Config file not found/);
    });

    it('should apply defaults for new fields', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('empty');
      (yaml.load as jest.Mock).mockReturnValue({});

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.maxBackoffMs).toBe(30 * 60 * 1000);
      expect(config.sseKeepaliveMs).toBe(30000);
      expect(config.accountInitRetries).toBe(3);
    });

    it('should default msg to empty string per webhook', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('yaml');
      (yaml.load as jest.Mock).mockReturnValue({
        webhooks: { discord: [{ url: 'https://x.com' }] },
      });

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.webhooks!.discord![0].msg).toBe('');
    });

    it('should default fetchPost to false', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('empty');
      (yaml.load as jest.Mock).mockReturnValue({});

      service = new ConfigService();
      const config = service.getConfig();

      expect(config.fetchPost).toBe(false);
    });
  });
});
