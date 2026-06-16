import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { CookieJar } from 'netscape-cookies-parser';

@Injectable()
export class CookieService extends EventEmitter {
  private readonly logger = new Logger(CookieService.name);

  constructor() {
    super();
    const cookieFile = process.env.COOKIE_FILE;
    if (cookieFile) {
      this.logger.log(`Watching cookie file: ${cookieFile}`);
      fs.watchFile(cookieFile, { interval: 30000 }, () => {
        this.logger.log('Cookie file changed');
        this.emit('changed');
      });
    }
  }

  getCookieString(): string {
    const cookieFile = process.env.COOKIE_FILE;
    if (!cookieFile) {
      throw new Error('COOKIE_FILE environment variable is not set');
    }

    if (!fs.existsSync(cookieFile)) {
      throw new Error(`Cookie file not found: ${cookieFile}`);
    }

    this.logger.log(`Loading cookies from: ${cookieFile}`);

    const content = fs.readFileSync(cookieFile, 'utf8');
    const jar = new CookieJar(content);
    const cookies = jar.parse<{ name: string; value: string; domain: string }>();

    if (!cookies || cookies.length === 0) {
      throw new Error(`No valid cookies parsed from: ${cookieFile}`);
    }

    // Filter to .youtube.com domain only, dedupe by name (keep last)
    const seen = new Set<string>();
    const filtered: { name: string; value: string }[] = [];
    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i];
      if (c.domain === '.youtube.com' && !seen.has(c.name)) {
        seen.add(c.name);
        filtered.unshift({ name: c.name, value: c.value });
      }
    }

    const cookieString = filtered
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    this.logger.log(`Parsed ${cookies.length} cookies, using ${filtered.length} from .youtube.com`);
    return cookieString;
  }
}
