import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: { getAccounts: jest.Mock };

  beforeEach(async () => {
    accountService = {
      getAccounts: jest.fn().mockReturnValue([
        { id: 'UC1', handle: '@a', name: 'Channel A', thumbnail_url: 'img.jpg', is_selected: true, is_disabled: false, pageId: undefined },
        { id: 'UC2', handle: '@b', name: 'Channel B', thumbnail_url: undefined, is_selected: false, is_disabled: false, pageId: 'P2' },
      ]),
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
  });

  it('GET /api/accounts should return empty when no accounts', () => {
    accountService.getAccounts.mockReturnValue([]);
    const result = controller.getAccounts();
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
