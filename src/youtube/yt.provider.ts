import { Injectable, Logger } from '@nestjs/common';
import { Innertube, Types } from 'youtubei.js';
import { CookieService } from './cookie.service';

@Injectable()
export class YTProvider {
  private readonly logger = new Logger(YTProvider.name);
  private readonly yts = new Map<string, Innertube>();

  constructor(private readonly cookieService: CookieService) {
    this.cookieService.on('changed', () => {
      this.logger.log('Cookie file changed, invalidating all Innertube sessions');
      this.yts.clear();
    });
  }

  getYt(channelId: string): Innertube | undefined {
    return this.yts.get(channelId);
  }

  deleteYt(channelId: string): void {
    this.yts.delete(channelId);
  }

  async initYt(channelId: string, pageId?: string): Promise<Innertube> {
    const existing = this.yts.get(channelId);
    if (existing) {
      return existing;
    }

    const cookie = this.cookieService.getCookieString();
    const opts: Types.InnerTubeConfig = { cookie };
    if (pageId) {
      opts.on_behalf_of_user = pageId;
    }

    const yt = await Innertube.create(opts);
    this.yts.set(channelId, yt);
    this.logger.log(`Innertube session created for channel ${channelId}${pageId ? ' (inactive)' : ' (active)'}`);
    return yt;
  }
}
