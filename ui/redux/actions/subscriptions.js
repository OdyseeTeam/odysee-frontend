// @flow
import * as ACTIONS from 'constants/action_types';
import REWARDS from 'rewards';
import { Lbryio } from 'lbryinc';
import { doClaimRewardType } from 'redux/actions/rewards';
import { parseURI } from 'util/lbryURI';
import { doAlertWaitingForSync } from 'redux/actions/app';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { doToast } from 'redux/actions/notifications';

export function doToggleSubscription(subscription: Subscription, hideToast?: boolean) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    const {
      sync: { prefsReady: ready },
    } = state;

    if (!ready) return dispatch(doAlertWaitingForSync());

    const { uri: subscriptionUri, channelName, notificationsDisabled } = subscription;

    const isSubscribed = selectIsSubscribedForUri(state, subscriptionUri);
    const { channelClaimId } = parseURI(subscriptionUri);

    if (!isSubscribed && !subscriptionUri.startsWith('lbry://')) {
      throw Error(`Subscription uris must include the "lbry://" prefix.\nTried to subscribe to ${subscriptionUri}`);
    }

    dispatch({
      type: !isSubscribed ? ACTIONS.CHANNEL_SUBSCRIBE : ACTIONS.CHANNEL_UNSUBSCRIBE,
      data: subscription,
    });

    if (!isSubscribed) {
      Lbryio.call('subscription', 'new', {
        channel_name: channelName,
        claim_id: channelClaimId,
        notifications_disabled: notificationsDisabled,
      });

      dispatch(doClaimRewardType(REWARDS.TYPE_SUBSCRIPTION, { failSilently: true }));
    } else {
      Lbryio.call('subscription', 'delete', {
        claim_id: channelClaimId,
      });
    }

    if (!hideToast) {
      dispatch(
        doToast({
          message: __(!isSubscribed ? 'You followed %CHANNEL_NAME%!' : 'Unfollowed %CHANNEL_NAME%.', {
            CHANNEL_NAME: channelName,
          }),
        })
      );
    }
  };
}
