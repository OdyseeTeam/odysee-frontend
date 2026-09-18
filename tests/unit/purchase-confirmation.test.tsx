import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

const { state } = vi.hoisted(() => ({ state: { claim: undefined as any, costInfo: undefined as any } }));
vi.mock('i18n', () => ({ __: (message) => message }));
vi.mock('analytics', () => ({ default: { log: vi.fn() } }));
vi.mock('redux/hooks', () => ({ useAppDispatch: () => vi.fn(), useAppSelector: (selector) => selector(state) }));
vi.mock('redux/selectors/content', () => ({
  selectInsufficientCreditsForUri: () => false,
  selectPlayingUri: () => ({ uri: null, collection: {} }),
}));
vi.mock('redux/selectors/claims', () => ({
  selectClaimForUri: (s) => s.claim,
  makeSelectMetadataForUri: () => (s) => s.claim?.value,
}));
vi.mock('redux/actions/app', () => ({}));
vi.mock('redux/actions/content', () => ({}));
vi.mock('util/lbryURI', () => ({}));
vi.mock('component/claimInsufficientCredits', () => ({ default: () => null }));
vi.mock('modal/modal', () => ({ Modal: ({ children }) => <div>{children}</div> }));
vi.mock('component/common/card', () => ({
  default: ({ title, subtitle, actions }) => (
    <div>
      {title}
      {subtitle}
      {actions}
    </div>
  ),
}));
vi.mock('component/i18nMessage', () => ({ default: ({ children }) => <span>{children}</span> }));
vi.mock('component/button', () => ({ default: ({ label, disabled }) => <button disabled={disabled}>{label}</button> }));

import ModalAffirmPurchase from '../../ui/modal/modalAffirmPurchase/view';

describe('the price displayed for approval', () => {
  it.each([undefined, { cost: 1 }, { cost: 100 }])(
    'shows the exact 100 LBC authorization despite missing or stale cost estimates',
    (costInfo) => {
      state.claim = {
        claim_id: 'abc',
        value_type: 'stream',
        value: {
          title: 'Paid content',
          fee: { amount: '100', currency: 'LBC', address: 'recipient' },
        },
      };
      state.costInfo = costInfo;
      const html = renderToStaticMarkup(<ModalAffirmPurchase uri="lbry://paid#abc" cancelPurchase={() => {}} />);
      expect(html).toContain('100 LBC');
      expect(html).toContain('<button>Purchase</button>');
    }
  );

  it('disables confirmation when no valid price is available', () => {
    state.claim = undefined;
    const html = renderToStaticMarkup(<ModalAffirmPurchase uri="lbry://paid#abc" cancelPurchase={() => {}} />);
    expect(html).toContain('Price unavailable');
    expect(html).toContain('<button disabled="">Purchase</button>');
  });
});
