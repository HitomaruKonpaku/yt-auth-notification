import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('api')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get('accounts')
  getAccounts() {
    const accounts: { id: string; handle: string; name: string; thumbnail_url?: string }[] = [];
    for (const [id, info] of this.accountService.accounts) {
      accounts.push({
        id,
        handle: info.handle,
        name: info.name,
        thumbnail_url: info.thumbnail_url,
      });
    }
    return { total: accounts.length, items: accounts };
  }
}
