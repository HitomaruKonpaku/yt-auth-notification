import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { ChannelRepo } from './channel.repo';

describe('ChannelService', () => {
  let service: ChannelService;
  let repo: { upsert: jest.Mock; exists: jest.Mock };

  const makeYt = (handle: string, name: string, browseId: string) => ({
    account: {
      getInfo: jest.fn().mockResolvedValue({
        contents: { contents: [{ channel_handle: handle, account_name: name }] },
      }),
    },
    resolveURL: jest.fn().mockResolvedValue({ payload: { browseId } }),
  });

  beforeEach(async () => {
    repo = { upsert: jest.fn().mockResolvedValue(undefined), exists: jest.fn().mockResolvedValue(true) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelService, { provide: ChannelRepo, useValue: repo }],
    }).compile();
    service = module.get<ChannelService>(ChannelService);
  });

  it('should resolve and persist channel on first call', async () => {
    const yt = makeYt('@test', 'Test Channel', 'UC123');
    const result = await service.ensureChannel(yt as any);
    expect(result).toBe('UC123');
    expect(repo.upsert).toHaveBeenCalledWith({ id: 'UC123', handle: '@test', name: 'Test Channel' });
  });

  it('should cache ownerId and skip resolve on subsequent calls', async () => {
    const yt = makeYt('@test', 'Test Channel', 'UC123');
    await service.ensureChannel(yt as any);
    const result = await service.ensureChannel(yt as any);
    expect(result).toBe('UC123');
    // resolveURL only called once — second call uses cache
    expect(yt.resolveURL).toHaveBeenCalledTimes(1);
  });

  it('should re-resolve if cached ownerId no longer in DB', async () => {
    // First ensureChannel resolves successfully (exists not called because ownerId is null)
    const yt1 = makeYt('@test', 'Test Channel', 'UC123');
    await service.ensureChannel(yt1 as any);

    // DB says channel gone — exists returns false, triggers re-resolve
    repo.exists.mockResolvedValue(false);
    const yt2 = makeYt('@test2', 'Test Channel 2', 'UC456');
    const result = await service.ensureChannel(yt2 as any);
    expect(result).toBe('UC456');
  });

  it('should return null on first failure and not crash', async () => {
    const yt = {
      account: { getInfo: jest.fn().mockRejectedValue(new Error('network error')) },
      resolveURL: jest.fn(),
    };
    const result = await service.ensureChannel(yt as any);
    expect(result).toBeUndefined();
  });

  it('should return previous ownerId on retry exhaustion', async () => {
    // First call succeeds (exists not called because ownerId is null initially)
    const yt1 = makeYt('@test', 'Test Channel', 'UC123');
    await service.ensureChannel(yt1 as any);

    // DB says channel gone, but resolve keeps failing
    repo.exists.mockResolvedValue(false);
    const failingYt = {
      account: { getInfo: jest.fn().mockRejectedValue(new Error('fail')) },
      resolveURL: jest.fn(),
    };

    // 3 retries max, all fail
    let result: string | undefined;
    for (let i = 0; i < 4; i++) {
      result = await service.ensureChannel(failingYt as any);
    }
    // After 3 failures, gives up and returns previous ownerId
    expect(failingYt.account.getInfo).toHaveBeenCalledTimes(3);
    expect(result).toBe('UC123');
  });
});
