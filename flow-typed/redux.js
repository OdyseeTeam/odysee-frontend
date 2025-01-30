// @flow

import type { AppState } from 'redux/reducers/app';
import type { LivestreamState } from 'redux/reducers/livestream';
import type { MembershipsState } from 'redux/reducers/memberships';
import type { StatsState } from 'extras/lbryinc/redux/reducers/stats';
import type { WalletState } from 'redux/reducers/wallet';

declare type Action = {
  type: string,
  data?: any,
};

declare type ThunkAction = (dispatch: Dispatch, getState: GetState) => any;
declare type PromiseAction = Promise<Action>;

declare type Dispatch = (action: Action | ThunkAction | PromiseAction) => any;
declare type GetState = () => State;

declare type State = {|
  app: AppState,
  arConnect: ArConnectState,
  blacklist: any,
  blocked: BlocklistState,
  claims: ClaimsState,
  coinSwap: CoinSwapState,
  collections: CollectionState,
  comments: CommentsState,
  content: ContentState,
  fileInfo: any,
  filtered: any,
  livestream: LivestreamState,
  memberships: MembershipsState,
  notifications: NotificationState,
  publish: PublishState,
  reactions: any,
  rewards: any,
  router: any,
  search: SearchState,
  settings: any,
  stats: StatsState,
  stripe: StripeState,
  subscriptions: SubscriptionState,
  sync: any,
  tags: TagState,
  user: UserState,
  wallet: WalletState,
|};
