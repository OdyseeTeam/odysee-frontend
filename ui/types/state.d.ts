/**
 * Redux slice state types.
 *
 * Type aliases for individual reducer state slices, referenced
 * in selectors and actions as bare global types.
 */

type ClaimsState = State['claims'];
type CommentsState = State['comments'];
type ContentState = State['content'];
type PublishSliceState = State['publish'];
type SearchState = State['search'];
type SyncState = State['sync'];
type SubscriptionState = State['subscriptions'];
type NotificationState = State['notifications'];
type TagState = State['tags'];
type BlocklistState = State['blocked'];
type CoinSwapState = State['coinSwap'];
type UserState = State['user'];

type CoinSwapInfo = {
  chargeCode: string;
  sendAddresses: Record<string, string>;
  sendAmounts: Record<string, string>;
  lbcAmount: number;
  status?: Record<string, any>;
  [key: string]: any;
};

type CoinSwapAddAction = {
  type: string;
  data: CoinSwapInfo;
};

type CoinSwapRemoveAction = {
  type: string;
  data: { chargeCode: string };
};
