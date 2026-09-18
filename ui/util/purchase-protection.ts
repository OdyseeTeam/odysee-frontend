/** The proxy's get RPC can purchase content. Every caller must pass this guard. */
export type PurchaseAuthorization = Readonly<{
  claimId: string;
  amount: number;
  currency: string;
  address: string;
}>;

export class PurchaseConfirmationRequiredError extends Error {
  constructor() {
    super('Confirm the current price before purchasing this content.');
    this.name = 'PurchaseConfirmationRequiredError';
  }
}

function streamClaim(claim: any): any {
  const seen = new Set();
  while (claim?.reposted_claim && !seen.has(claim)) {
    seen.add(claim);
    claim = claim.reposted_claim;
  }
  return claim?.value_type === 'stream' && claim.value && !claim.error ? claim : undefined;
}

export function isClaimFree(claim: any): boolean {
  const stream = streamClaim(claim);
  if (!stream) return false;
  const fee = stream.value.fee;
  return (
    fee == null ||
    ((typeof fee.amount === 'string' || typeof fee.amount === 'number') &&
      String(fee.amount).trim() !== '' &&
      Number(fee.amount) === 0)
  );
}

/** Bind approval to the claim and the price shown in the confirmation dialog. */
export function getPurchaseAuthorization(claim: any): PurchaseAuthorization | undefined {
  const stream = streamClaim(claim);
  const fee = stream?.value.fee;
  const amount = Number(fee?.amount);
  if (
    !stream?.claim_id ||
    !['string', 'number'].includes(typeof fee?.amount) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !['LBC', 'USD', 'BTC'].includes(fee?.currency) ||
    !fee?.address
  )
    return undefined;
  return Object.freeze({ claimId: stream.claim_id, amount, currency: fee.currency, address: fee.address });
}

// These access-controlled streams are signed or rejected by the proxy before
// its LBC purchase fallback. Do not treat arbitrary tags or access keys as consent.
function hasProtectedAccess(claim: any): boolean {
  return (
    claim.value.tags?.some(
      (tag: string) =>
        ['c:purchase', 'c:rental', 'c:members-only', 'c:unlisted'].includes(tag) ||
        tag.startsWith('purchase:') ||
        tag.startsWith('rental:')
    ) === true
  );
}

export function hasValidFiatPurchase(purchases: any, claimId: string): boolean {
  // Match the proxy's first-record semantics; a later valid record cannot
  // prevent its purchase fallback when the first record is still pending.
  const purchase = Array.isArray(purchases) ? purchases[0] : undefined;
  return Boolean(
    purchase &&
    (purchase.target_claim_id === claimId || purchase.reference_claim_id === claimId) &&
    ['confirmed', 'submitted'].includes(purchase.status) &&
    (purchase.type === 'purchase' ||
      (purchase.type === 'rental' && new Date(purchase.valid_through).getTime() > Date.now()))
  );
}

type GetParams = { uri: string; [key: string]: any };
type Dependencies = {
  resolve: (params: Record<string, any>) => Promise<any>;
  get: (params: GetParams) => Promise<any>;
  hasFiatPurchase: (claimId: string, environment?: string) => Promise<boolean>;
  getContext: () => string;
};

export function createPurchaseProtectedGet(deps: Dependencies) {
  const inFlight = new Map<string, Promise<any>>();

  return async (params: GetParams, authorization?: PurchaseAuthorization) => {
    const context = deps.getContext();
    // Never infer a free price from missing/stale Redux data. Ask the wallet for
    // current ownership and receipts, including when called outside Redux.
    const resolved = await deps.resolve({
      urls: [params.uri],
      include_purchase_receipt: true,
      include_is_my_output: true,
      ...(params.wallet_id ? { wallet_id: params.wallet_id } : {}),
    });
    const claim = streamClaim(resolved?.[params.uri]);
    if (!claim?.claim_id || !claim.permanent_url) throw new PurchaseConfirmationRequiredError();

    const price = getPurchaseAuthorization(claim);
    const approved =
      price &&
      authorization &&
      price.claimId === authorization.claimId &&
      price.amount === authorization.amount &&
      price.currency === authorization.currency &&
      price.address === authorization.address;
    const alreadyOwned = claim.is_my_output === true || Boolean(claim.purchase_receipt?.txid);
    if (!isClaimFree(claim) && !alreadyOwned && !hasProtectedAccess(claim) && !approved) {
      // Legacy fiat purchases can have an on-chain fee without a purchase tag.
      // A failed entitlement lookup must never fall back to spending LBC.
      if (!price || !(await deps.hasFiatPurchase(claim.claim_id, params.environment).catch(() => false))) {
        throw new PurchaseConfirmationRequiredError();
      }
    }

    if (context !== deps.getContext()) throw new Error('Account changed while loading content. Please try again.');

    // Pin short/channel URLs and reposts to the checked claim. Share concurrent
    // requests, including requests from independent preview/player components.
    const getParams = { ...params, uri: claim.permanent_url };
    const canPurchase = approved && !alreadyOwned && !hasProtectedAccess(claim);
    const key = JSON.stringify([context, params.wallet_id, canPurchase ? claim.claim_id : getParams]);
    const pending = inFlight.get(key);
    if (pending) return pending;
    const request = deps.get(getParams);
    inFlight.set(key, request);
    try {
      return await request;
    } finally {
      inFlight.delete(key);
    }
  };
}
