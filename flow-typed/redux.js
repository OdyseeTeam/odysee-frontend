// @flow

import type { AppState } from 'redux/reducers/app';
import type { LivestreamState } from 'redux/reducers/livestream';
import type { MembershipsState } from 'redux/reducers/memberships';
import type { WalletState } from 'redux/reducers/wallet';

declare type Action = {
  type: string,
  data?: any,
};

declare type ThunkAction = (dispatch: Dispatch, getState: GetState) => any;
declare type PromiseAction = Promise<Action>;

declare type Dispatch = (action: Action | ThunkAction | PromiseAction) => any;
declare type GetState = () => State;

// TODO: fix the commented ones
declare type State =
  & AppState
  & BlocklistState
  // & ClaimState
  & CoinSwapState
  & CommentsState
  & ContentState
  // & FileInfoState
  & LivestreamState
  & MembershipsState
  & NotificationState
  & PublishState
  // & ReactionsState
  & ReportContentState
  // & RewardsState
  & SearchState
  // & Settings
  & StripeState
  & SubscriptionState
  & SyncState
  & TagState
  & UserState
  & WalletState;
