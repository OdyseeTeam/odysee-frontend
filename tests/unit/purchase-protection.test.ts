import { describe, expect, it, vi } from 'vite-plus/test';
import {
  createPurchaseProtectedGet,
  getPurchaseAuthorization,
  hasValidFiatPurchase,
  isClaimFree,
  PurchaseConfirmationRequiredError,
} from '../../ui/util/purchase-protection';

const uri = 'lbry://paid#abc';
const paid = () => ({
  claim_id: 'abc',
  permanent_url: uri,
  value_type: 'stream',
  value: { fee: { amount: '100', currency: 'LBC', address: 'recipient' } },
});
const free = () => ({ ...paid(), value: { source: { media_type: 'video/mp4' } } });
function setup(claim: any = paid()) {
  const deps = {
    resolve: vi.fn(async ({ urls }) => ({ [urls[0]]: claim })),
    get: vi.fn(async () => ({ streaming_url: 'https://media.test/video' })),
    hasFiatPurchase: vi.fn(async () => false),
    getContext: vi.fn(() => 'account-a'),
  };
  return { ...deps, guardedGet: createPurchaseProtectedGet(deps) };
}

describe('purchase protection at the get boundary', () => {
  it.each(['LBC', 'USD', 'BTC'])('blocks a passive fetch with a positive %s fee', async (currency) => {
    const claim = paid();
    claim.value.fee.currency = currency;
    const api = setup(claim);
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
    expect(api.resolve).toHaveBeenCalledWith({
      urls: [uri],
      include_purchase_receipt: true,
      include_is_my_output: true,
    });
  });

  it.each([
    undefined,
    null,
    { error: 'not found' },
    { value_type: 'stream' },
    { ...paid(), value_type: 'channel' },
    { ...paid(), permanent_url: undefined },
  ])('fails closed for unresolved/incomplete metadata (%j)', async (claim) => {
    const api = setup(null);
    api.resolve.mockResolvedValue({ [uri]: claim });
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it.each(['NaN', 'Infinity', '-1', '', ' ', null, undefined, false, true, {}])(
    'does not treat an invalid fee as free (%j)',
    async (amount) => {
      const claim: any = paid();
      claim.value.fee.amount = amount;
      const api = setup(claim);
      await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
      expect(api.get).not.toHaveBeenCalled();
    }
  );

  it('loads confirmed purchases and preserves the checked permanent URI and access parameters', async () => {
    const claim = paid();
    const api = setup(claim);
    const params = { uri: 'lbry://paid', environment: 'test', signature: 'sig', signature_ts: '123' };
    await api.guardedGet(params, getPurchaseAuthorization(claim));
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ ...params, uri });
    expect(params.uri).toBe('lbry://paid');
  });

  it.each(['claimId', 'amount', 'currency', 'address'])('rejects approval for a different %s', async (field) => {
    const claim = paid();
    const authorization: any = { ...getPurchaseAuthorization(claim), [field]: 'different' };
    const api = setup(claim);
    await expect(api.guardedGet({ uri }, authorization)).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('rechecks a free claim that became paid before get', async () => {
    const api = setup(paid());
    expect(isClaimFree(free())).toBe(true);
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('checks the target of a repost rather than the free wrapper', async () => {
    const api = setup({ ...free(), value_type: 'repost', reposted_claim: paid() });
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
    await api.guardedGet({ uri }, getPurchaseAuthorization(paid()));
    expect(api.get).toHaveBeenCalledOnce();
  });

  it.each([
    free(),
    { ...paid(), value: { fee: { amount: '0', currency: 'LBC' } } },
    { ...paid(), is_my_output: true },
    { ...paid(), purchase_receipt: { txid: 'receipt' } },
  ])('preserves free, owned, and already-purchased playback', async (claim) => {
    const api = setup(claim);
    await expect(api.guardedGet({ uri })).resolves.toHaveProperty('streaming_url');
    expect(api.get).toHaveBeenCalledOnce();
    expect(api.hasFiatPurchase).not.toHaveBeenCalled();
  });

  it.each([null, {}, { txid: '' }])('does not accept an empty receipt (%j)', async (receipt) => {
    const api = setup({ ...paid(), purchase_receipt: receipt });
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it.each(['c:purchase', 'purchase:5', 'c:rental', 'rental:5:3600', 'c:members-only', 'c:unlisted'])(
    'preserves proxy-authorized access for %s',
    async (tag) => {
      const claim = { ...paid(), value: { ...paid().value, tags: [tag] } };
      const api = setup(claim);
      await api.guardedGet({ uri, base_streaming_url: 'https://live.test', signature: 'sig' });
      expect(api.get).toHaveBeenCalledExactlyOnceWith({
        uri,
        base_streaming_url: 'https://live.test',
        signature: 'sig',
      });
    }
  );

  it('does not mistake a signature or an unrecognized tag for spending authorization', async () => {
    const api = setup({ ...paid(), value: { ...paid().value, tags: ['c:purchase:5', 'members-only'] } });
    await expect(api.guardedGet({ uri, signature: 'sig' })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('permits a verified legacy fiat purchase without authorizing a new LBC purchase', async () => {
    const api = setup();
    api.hasFiatPurchase.mockResolvedValue(true);
    await api.guardedGet({ uri, environment: 'test' });
    expect(api.hasFiatPurchase).toHaveBeenCalledWith('abc', 'test');
    expect(api.get).toHaveBeenCalledOnce();
  });

  it('fails closed on entitlement lookup errors', async () => {
    const api = setup();
    api.hasFiatPurchase.mockRejectedValue(new Error('offline'));
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not use ownership from a different account', async () => {
    const api = setup({ ...paid(), is_my_output: true });
    api.getContext.mockReturnValueOnce('account-a').mockReturnValue('account-b');
    await expect(api.guardedGet({ uri })).rejects.toThrow('Account changed');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('coalesces concurrent approved fetches, including URI aliases and different callers', async () => {
    const api = setup();
    let finish: (value: any) => void;
    api.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const approval = getPurchaseAuthorization(paid());
    const first = api.guardedGet({ uri }, approval);
    const second = api.guardedGet({ uri: 'lbry://@channel/paid', environment: 'test' }, approval);
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce());
    finish({ streaming_url: 'https://media.test/video' });
    expect(await first).toEqual(await second);
    expect(api.get).toHaveBeenCalledOnce();
  });

  it('keeps protected livestream and VOD requests separate', async () => {
    const claim = { ...paid(), value: { ...paid().value, tags: ['c:members-only'] } };
    const api = setup(claim);
    const pending: ((value: any) => void)[] = [];
    api.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        })
    );
    const vod = api.guardedGet({ uri, environment: 'live' });
    const live = api.guardedGet({ uri, environment: 'live', base_streaming_url: 'https://live.test' });
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    pending[0]({ streaming_url: 'vod' });
    pending[1]({ streaming_url: 'live' });
    expect(await vod).toEqual({ streaming_url: 'vod' });
    expect(await live).toEqual({ streaming_url: 'live' });
  });

  it('does not retry a failed spending request automatically', async () => {
    const api = setup();
    api.get.mockRejectedValue(new Error('timeout after possible broadcast'));
    await expect(api.guardedGet({ uri }, getPurchaseAuthorization(paid()))).rejects.toThrow('timeout');
    await expect(api.guardedGet({ uri })).rejects.toBeInstanceOf(PurchaseConfirmationRequiredError);
    expect(api.get).toHaveBeenCalledOnce();
  });
});

describe('fiat entitlement validation', () => {
  it('rejects a pending first record even if a later record is confirmed', () => {
    const rows = ['pending', 'confirmed'].map((status) => ({ target_claim_id: 'abc', status, type: 'purchase' }));
    expect(hasValidFiatPurchase(rows, 'abc')).toBe(false);
  });
  const purchase = { target_claim_id: 'abc', status: 'confirmed', type: 'purchase' };
  it('accepts confirmed/submitted purchases and current rentals', () => {
    expect(hasValidFiatPurchase([purchase], 'abc')).toBe(true);
    expect(hasValidFiatPurchase([{ ...purchase, status: 'submitted' }], 'abc')).toBe(true);
    expect(hasValidFiatPurchase([{ ...purchase, type: 'rental', valid_through: '2999-01-01' }], 'abc')).toBe(true);
  });
  it.each([
    { ...purchase, target_claim_id: 'other' },
    { ...purchase, status: 'pending' },
    { ...purchase, type: 'rental', valid_through: '2000-01-01' },
    { ...purchase, type: 'rental' },
  ])('rejects an unrelated, pending, or expired entitlement', (entry) => {
    expect(hasValidFiatPurchase([entry], 'abc')).toBe(false);
  });
});
