import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { getPurchaseAuthorization, PurchaseConfirmationRequiredError } from '../../ui/util/purchase-protection';

const { get, sign } = vi.hoisted(() => ({ get: vi.fn(), sign: vi.fn() }));
vi.mock('i18n', () => ({ __: (message) => message }));
vi.mock('lbry', () => ({ default: { get, channel_sign: sign } }));
vi.mock('lbryinc', () => ({ Lbryio: {} }));
vi.mock('recsys', () => ({ default: {} }));
vi.mock('redux/router', () => ({ navigateBack: vi.fn(), navigateTo: vi.fn() }));
vi.mock('redux/actions/app', () => ({
  doOpenModal: (modal, data) => ({ type: 'modal', modal, data }),
  doHideModal: () => ({ type: 'hide-modal' }),
}));
vi.mock('redux/actions/claims', () => ({}));
vi.mock('redux/actions/collections', () => ({}));
vi.mock('redux/actions/notifications', () => ({ doToast: (data) => ({ type: 'toast', data }) }));
vi.mock('redux/selectors/claims', () => ({
  selectClaimForUri: (state) => state.claim,
  selectClaimIsMine: (state) => state.owned,
  selectClaimIsMineForUri: (state) => state.owned,
  selectClaimWasPurchasedForUri: (state) => Boolean(state.claim?.purchase_receipt?.txid),
  selectClaimIdForUri: (state) => state.claim?.claim_id,
  selectCostInfoForUri: (state) => state.costInfo,
  selectIsFiatRequiredForUri: (state) => state.fiatRequired,
  selectPurchaseMadeForClaimId: (state) => state.fiatPaid,
  selectValidRentalPurchaseForClaimId: (state) => state.rentalPaid,
  selectClaimOutpointForUri: () => 'outpoint',
  selectIsLivestreamClaimForUri: () => false,
  selectProtectedContentTagForUri: () => false,
}));
vi.mock('redux/selectors/file_info', () => ({
  makeSelectFileInfoForUri: () => (state) => state.fileInfo,
  selectOutpointFetchingForUri: (state) => state.fetching,
}));
vi.mock('redux/selectors/content', () => ({}));
vi.mock('redux/selectors/wallet', () => ({ selectBalance: () => 1000 }));
vi.mock('redux/selectors/collections', () => ({}));
vi.mock('redux/selectors/livestream', () => ({}));
vi.mock('redux/selectors/settings', () => ({ selectClientSetting: (state, key) => state.settings[key] }));
vi.mock('util/stripe', () => ({ getStripeEnvironment: () => 'test' }));
vi.mock('util/claim', () => ({ getChannelIdFromClaim: () => 'channel', isClaimUnlisted: () => false }));
vi.mock('util/url', () => ({}));
vi.mock('util/hex', () => ({ toHex: (value) => value }));

import { doPlayUri } from '../../ui/redux/actions/content';
import { doFileGetForUri } from '../../ui/redux/actions/file';
import * as MODALS from '../../ui/constants/modal_types';

const uri = 'lbry://paid#abc';
const paid = () => ({
  claim_id: 'abc',
  value_type: 'stream',
  permanent_url: uri,
  value: { fee: { amount: '100', currency: 'LBC', address: 'recipient' } },
});
function store(overrides = {}) {
  const state = {
    claim: paid(),
    costInfo: { cost: 100 },
    content: { uriAccessKeys: {} },
    settings: { instant_purchase_enabled: true, instant_purchase_max: { amount: 1000, currency: 'LBC' } },
    ...overrides,
  };
  const actions: any[] = [];
  const dispatch: any = (action) =>
    typeof action === 'function' ? action(dispatch, () => state) : actions.push(action);
  return { state, actions, dispatch };
}
beforeEach(() => {
  get.mockReset().mockResolvedValue({ streaming_url: 'https://media.test' });
  sign.mockReset().mockResolvedValue({ signature: 'signed', signing_ts: '123' });
});

describe('purchase consent through the real Redux actions', () => {
  it('always asks for confirmation even when a saved instant-purchase threshold covers the price', async () => {
    const { dispatch, actions } = store();
    await dispatch(doPlayUri(uri));
    expect(actions).toContainEqual({ type: 'modal', modal: MODALS.AFFIRM_PURCHASE, data: { uri } });
    expect(get).not.toHaveBeenCalled();
  });

  it('does not interpret a missing cost estimate as free content', async () => {
    const { dispatch, actions } = store({ costInfo: undefined });
    await dispatch(doPlayUri(uri));
    expect(actions.some((action) => action.modal === MODALS.AFFIRM_PURCHASE)).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('passes approval to the guarded get only after confirmation and awaits completion', async () => {
    const { dispatch } = store();
    const approval = getPurchaseAuthorization(paid());
    const success = vi.fn();
    await dispatch(doPlayUri(uri, approval, false, success));
    expect(get).toHaveBeenCalledExactlyOnceWith({ uri, environment: 'test' }, approval);
    expect(success).toHaveBeenCalledExactlyOnceWith({ streaming_url: 'https://media.test' });
  });

  it('loads free content without creating spending authorization', async () => {
    const { dispatch } = store({ claim: { ...paid(), value: {} }, costInfo: { cost: 0 } });
    await dispatch(doPlayUri(uri));
    expect(get).toHaveBeenCalledExactlyOnceWith({ uri, environment: 'test' }, null);
  });

  it('preserves owner signatures without treating them as purchase consent', async () => {
    const { dispatch } = store({ owned: true });
    await dispatch(doFileGetForUri(uri));
    expect(get).toHaveBeenCalledExactlyOnceWith(
      { uri, environment: 'test', key: 'signature', value: 'signed', signature: 'signed', signature_ts: '123' },
      undefined
    );
  });

  it('background denial neither opens a modal nor shows an error toast or retries', async () => {
    const { dispatch, actions } = store();
    get.mockRejectedValue(new PurchaseConfirmationRequiredError());
    await dispatch(doFileGetForUri(uri));
    expect(actions.some((action) => action.type === 'modal' || action.type === 'toast')).toBe(false);
    expect(get).toHaveBeenCalledOnce();
  });

  it('shows a failed confirmation without reporting a completed purchase', async () => {
    const { dispatch, actions } = store();
    const success = vi.fn();
    get.mockRejectedValue(new PurchaseConfirmationRequiredError());
    await dispatch(doPlayUri(uri, getPurchaseAuthorization(paid()), false, success));
    expect(success).not.toHaveBeenCalled();
    expect(actions.some((action) => action.type === 'toast')).toBe(true);
  });

  it('does not report a purchase from stale cached file information', async () => {
    const { dispatch } = store({ fileInfo: { streaming_url: 'old-free-url' } });
    const success = vi.fn();
    get.mockRejectedValue(new PurchaseConfirmationRequiredError());
    await dispatch(doPlayUri(uri, getPurchaseAuthorization(paid()), false, success));
    expect(get).toHaveBeenCalledOnce();
    expect(success).not.toHaveBeenCalled();
  });

  it('preserves the separate fiat purchase flow', async () => {
    const { dispatch, actions } = store({ fiatRequired: true });
    await dispatch(doPlayUri(uri));
    expect(actions).toContainEqual({ type: 'modal', modal: MODALS.PREORDER_AND_PURCHASE_CONTENT, data: { uri } });
    expect(get).not.toHaveBeenCalled();
  });

  it('loads an existing fiat purchase without authorizing any new LBC spend', async () => {
    const { dispatch } = store({ fiatRequired: true, fiatPaid: true });
    await dispatch(doPlayUri(uri));
    expect(get).toHaveBeenCalledExactlyOnceWith({ uri, environment: 'test' }, null);
  });
});
