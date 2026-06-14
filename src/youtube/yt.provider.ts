import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import Innertube from 'youtubei.js';
import { CookieService } from './cookie.service';

@Injectable()
export class YTProvider implements OnModuleInit {
  private readonly logger = new Logger(YTProvider.name);
  private yt: Innertube | null = null;

  constructor(private readonly cookieService: CookieService) { }

  onModuleInit() {
    const cookieFile = process.env.COOKIE_FILE;
    if (!cookieFile) {
      return;
    }

    this.logger.log(`Watching cookie file: ${cookieFile}`);
    fs.watchFile(cookieFile, { interval: 30000 }, () => {
      this.logger.log('Cookie file changed, invalidating Innertube session');
      this.yt = null;
    });
  }

  async getYt(): Promise<Innertube> {
    if (this.yt) {
      return this.yt;
    }

    try {
      const cookie = this.cookieService.getCookieString();
      this.yt = await Innertube.create({ cookie });
      this.logger.log('Innertube session created successfully');
      return this.yt;
    } catch (err) {
      this.logger.error('Failed to create Innertube session', err);
      throw err;
    }
  }
}
