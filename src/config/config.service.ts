import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { AppConfig, DiscordWebhookConfig } from './config.interface';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly config: AppConfig;

  constructor() {
    const configPath = process.env.CONFIG_FILE || 'config.yaml';

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    let raw: Record<string, any> | null;
    try {
      raw = yaml.load(fs.readFileSync(configPath, 'utf8')) as Record<string, any> | null;
    } catch (err) {
      throw new Error(`Failed to parse config file: ${configPath}`, { cause: err });
    }

    const data: Record<string, any> = raw || {};
    const discordRaw: DiscordWebhookConfig[] = data?.webhooks?.discord || [];

    this.config = {
      interval: Number(data.interval) || 60,
      maxBackoffMs: Number(data.maxBackoffMs) || 30 * 60 * 1000,
      sseKeepaliveMs: Number(data.sseKeepaliveMs) || 30000,
      accountInitRetries: Number(data.accountInitRetries) || 3,
      webhooks: {
        discord: discordRaw
          .filter(w => typeof w.url === 'string' && w.url.length > 0)
          .map(w => ({ url: w.url, msg: w.msg ?? '' })),
      },
    };

    const skipped = discordRaw.length - this.config.webhooks!.discord!.length;
    if (skipped > 0) {
      this.logger.warn(`Skipped ${skipped} webhook entries with missing/invalid url`);
    }
  }

  getConfig(): Readonly<AppConfig> {
    return this.config;
  }
}
