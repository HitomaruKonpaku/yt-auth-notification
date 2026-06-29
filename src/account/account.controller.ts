import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('api')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get('accounts')
  getAccounts() {
    const items = this.accountService.getAccounts();
    return { total: items.length, items };
  }
}
