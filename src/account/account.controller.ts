import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('api/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get()
  getAccounts() {
    const items = this.accountService.getAccounts();
    return { total: items.length, items };
  }
}
