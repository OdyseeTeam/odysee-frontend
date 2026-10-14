import { describe, expect, it, vi } from 'vite-plus/test';
import { MINIMUM_PUBLISH_BID } from '../../ui/constants/claim';
import { resolvePublishPayload, resolveValidBid } from '../../ui/util/publish';

vi.mock('i18n', () => ({ __: (message) => message }));

describe('resolveValidBid', () => {
  it('keeps a valid bid', () => {
    expect(resolveValidBid(2.5, '10.0')).toBe(2.5);
  });

  it('falls back to the existing deposit when editing', () => {
    expect(resolveValidBid(NaN, '10.0')).toBe(10);
    expect(resolveValidBid(null, 10)).toBe(10);
  });

  it('falls back to the minimum when there is no existing deposit', () => {
    expect(resolveValidBid(NaN, undefined)).toBe(MINIMUM_PUBLISH_BID);
    expect(resolveValidBid(undefined, null)).toBe(MINIMUM_PUBLISH_BID);
    expect(resolveValidBid(NaN, 'NaN')).toBe(MINIMUM_PUBLISH_BID);
  });
});

describe('publish payload bid', () => {
  function payloadBid(bid: unknown, myClaimForUri: any) {
    const publishData: any = { name: 'video', bid, tags: [], language: 'en' };
    const payload: any = resolvePublishPayload(publishData, myClaimForUri, [], {} as any, false);
    return payload.bid;
  }

  it('never sends NaN when the deposit field was cleared on an edit', () => {
    expect(payloadBid(NaN, { name: 'video', claim_id: 'abc', amount: '10.0' })).toBe('10.00000000');
  });

  it('sends the minimum when there is no claim to fall back to', () => {
    expect(payloadBid(null, null)).toBe('0.00100000');
  });

  it('sends the entered bid unchanged', () => {
    expect(payloadBid(0.5, { name: 'video', claim_id: 'abc', amount: '10.0' })).toBe('0.50000000');
  });
});
