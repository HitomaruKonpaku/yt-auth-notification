import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/dto/api-paginated-response.decorator';
import type { PaginatedResult } from '../common/pagination';
import { AccountService } from './account.service';
import { AccountDto } from './dto/account.dto';

@ApiTags('accounts')
@Controller('api/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get()
  @ApiOperation({ summary: 'List configured accounts' })
  @ApiPaginatedResponse(AccountDto)
  getAccounts(): PaginatedResult<AccountDto> {
    const items = this.accountService.getAccounts();
    return { total: items.length, items };
  }
}
