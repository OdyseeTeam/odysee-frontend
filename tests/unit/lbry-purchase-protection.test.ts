import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { getPurchaseAuthorization } from '../../ui/util/purchase-protection';

const { effects, customerList } = vi.hoisted(() => ({
  effects: [] as (() => any)[],
  customerList: vi.fn(async () => []),
}));
vi.mock('i18n', () => ({ __: (message) => message }));
vi.mock('analytics', () => ({ default: { error: vi.fn() } }));
vi.mock('config', () => ({ PROXY_URL_NO_CF: '' }));
vi.mock('util/fetch', () => ({ default: (_timeout, request) => request }));
vi.mock('lbryinc', () => ({ Lbryio: { call: customerList } }));
vi.mock('react', () => ({
  default: {
    useState: (initial) => [initial, vi.fn()],
    useRef: (initial) => ({ current: initial }),
    useEffect: (callback) => effects.push(callback),
  },
}));
vi.mock('component/viewers/videoViewer/internal/hls', () => ({
  loadHlsConstructor: vi.fn(),
  HLS_EVENT_MANIFEST_PARSED: 'manifest',
}));

import Lbry from '../../ui/lbry';
import useHlsVideoPreview from '../../ui/effects/use-hls-video-preview';
import useVideoPreviewOnHover from '../../ui/effects/use-video-preview-on-hover';

const uri = 'lbry://paid#abc';
const claim = {
  claim_id: 'abc',
  value_type: 'stream',
  permanent_url: uri,
  value: { fee: { amount: '100', currency: 'LBC', address: 'recipient' } },
};
let requests: any[];
beforeEach(() => {
  requests = [];
  effects.length = 0;
  customerList.mockResolvedValue([]);
  Lbry.setDaemonConnectionString('https://rpc.test');
  Lbry.setApiHeader('X-Lbry-Auth-Token', 'test-account');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, options) => {
      const rpc = JSON.parse(options.body);
      requests.push(rpc);
      const result = rpc.method === 'resolve' ? { [rpc.params.urls[0]]: claim } : {};
      return { ok: true, status: 200, json: async () => ({ result }) };
    })
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('real media callers use the guarded RPC boundary', () => {
  it.each(['hls', 'frames'])('paid %s hover previews never issue a get RPC even if enabled', async (kind) => {
    if (kind === 'hls') useHlsVideoPreview(null, uri, true);
    else useVideoPreviewOnHover(null, uri, 600, true);
    const cleanup = effects.map((effect) => effect());
    await vi.waitFor(() => expect(customerList).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requests.map((r) => r.method)).toEqual(['resolve']);
    cleanup.forEach((fn) => {
      if (typeof fn === 'function') fn();
    });
  });

  it('uses the RPC identity for fiat entitlement checks', async () => {
    await expect(Lbry.get({ uri })).rejects.toThrow('Confirm the current price');
    expect(customerList).toHaveBeenCalledWith('customer', 'list', {
      claim_id_filter: 'abc',
      environment: undefined,
      auth_token: 'test-account',
    });
  });

  it('rejects a direct background get with no purchase authorization', async () => {
    await expect(Lbry.get({ uri })).rejects.toThrow('Confirm the current price');
    expect(requests.map((r) => r.method)).toEqual(['resolve']);
  });

  it('only sends get after explicit price-bound approval, without leaking approval into RPC params', async () => {
    await Lbry.get({ uri }, getPurchaseAuthorization(claim));
    expect(requests.map((r) => r.method)).toEqual(['resolve', 'get']);
    expect(requests[1].params).toEqual({ uri });
  });
});
