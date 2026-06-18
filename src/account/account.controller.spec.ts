import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: { accounts: IterableIterator<[string, any]> };

  beforeEach(async () => {
    accountService = {
      accounts: (function* () {
        yield ['UC1', { handle: '@a', name: 'Channel A', thumbnail_url: 'img.jpg' }];
        yield ['UC2', { handle: '@b', name: 'Channel B', thumbnail_url: undefined }];
      })(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: accountService }],
    }).compile();
    controller = module.get<AccountController>(AccountController);
  });

  it('GET /api/accounts should return all accounts', () => {
    const result = controller.getAccounts();
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({ id: 'UC1', handle: '@a', name: 'Channel A', thumbnail_url: 'img.jpg' });
    expect(result.items[1]).toEqual({ id: 'UC2', handle: '@b', name: 'Channel B', thumbnail_url: undefined });
  });

  it('GET /api/accounts should return empty when no accounts', () => {
    accountService.accounts = (function* () {}()) as any;
    const result = controller.getAccounts();
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
