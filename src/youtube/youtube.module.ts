import { Global, Module } from '@nestjs/common';
import { CookieService } from './cookie.service';
import { YTProvider } from './yt.provider';

@Global()
@Module({
  providers: [
    CookieService,
    YTProvider,
  ],
  exports: [
    CookieService,
    YTProvider,
  ],
})
export class YoutubeModule { }
