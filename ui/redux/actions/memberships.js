// @flow
import * as ACTIONS from 'constants/action_types';
import { Lbryio } from 'lbryinc';
import { doToast } from 'redux/actions/notifications';
import { selectMembershipForChannelUri } from 'redux/selectors/memberships';
import { ODYSEE_CHANNEL_ID } from 'constants/odysee';
import { buildURI } from 'util/lbryURI';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

/***
 * Given a user, return their highest ranking Odysee membership (Premium or Premium Plus)
 * @param dispatch
 * @param user
 * @returns {Promise<void>}
 */
export function doCheckUserOdyseeMemberships(user) {
  return async (dispatch) => {
    // get memberships for a given user
    // TODO: in the future, can we specify this just to @odysee?

    const response = await Lbryio.call(
      'membership',
      'mine',
      {
        environment: stripeEnvironment,
      },
      'post'
    );

    let savedMemberships = [];
    let highestMembershipRanking;

    // TODO: this will work for now, but it should be adjusted
    // TODO: to check if it's active, or if it's cancelled if it's still valid past current date
    // loop through all memberships and save the @odysee ones
    // maybe in the future we can only hit @odysee in the API call
    for (const membership of response) {
      if (membership.MembershipDetails && membership.MembershipDetails.channel_name === '@odysee') {
        savedMemberships.push(membership.MembershipDetails.name);
      }
    }

    // determine highest ranking membership based on returned data
    // note: this is from an odd state in the API where a user can be both premium/Premium + at the same time
    // I expect this can change once upgrade/downgrade is implemented
    if (savedMemberships.length > 0) {
      // if premium plus is a membership, return that, otherwise it's only premium
      const premiumPlusExists = savedMemberships.includes('Premium+');
      if (premiumPlusExists) {
        highestMembershipRanking = 'Premium+';
      } else {
        highestMembershipRanking = 'Premium';
      }
    }

    dispatch({
      type: ACTIONS.ADD_ODYSEE_MEMBERSHIP_DATA,
      data: { user, odyseeMembershipName: highestMembershipRanking },
    });
  };
}

/***
 * Receives a csv of channel claim ids, hits the backend and returns nicely formatted object with relevant info
 * @param claimIdCsv
 * @returns {(function(*): Promise<void>)|*}
 */
export function doFetchUserMemberships(claimIdCsv) {
  return async (dispatch) => {
    if (!claimIdCsv || (claimIdCsv.length && claimIdCsv.length < 1)) return;

    // check if users have odysee memberships (premium/premium+)
    const response = await Lbryio.call('membership', 'check', {
      channel_id: ODYSEE_CHANNEL_ID,
      claim_ids: claimIdCsv,
      environment: stripeEnvironment,
    });

    let updatedResponse = {};

    // loop through returned users
    for (const user in response) {
      // if array was returned for a user (indicating a membership exists), otherwise is null
      if (response[user] && response[user].length) {
        // get membership for user
        // note: a for loop is kind of odd, indicates there may be multiple memberships?
        // probably not needed depending on what we do with the frontend, should revisit
        for (const membership of response[user]) {
          if (membership.channel_name) {
            updatedResponse[user] = membership.name;
            window.checkedMemberships[user] = membership.name;
          }
        }
      } else {
        // note the user has been fetched but is null
        updatedResponse[user] = null;
        window.checkedMemberships[user] = null;
      }
    }

    dispatch({ type: ACTIONS.ADD_CLAIMIDS_MEMBERSHIP_DATA, data: { response: updatedResponse } });
  };
}

export function doMembershipMine(channelName?: string) {
  return async (dispatch: Dispatch) => {
    try {
      // show the memberships the user is subscribed to
      const response = await Lbryio.call(
        'membership',
        'mine',
        {
          environment: stripeEnvironment,
        },
        'post'
      );

      const activeMemberships = [];
      const canceledMemberships = [];
      const purchasedMemberships = [];

      for (const membership of response) {
        // if it's autorenewing it's considered 'active'
        const isActive = membership.Membership.auto_renew;
        if (isActive) {
          activeMemberships.push(membership);
        } else {
          canceledMemberships.push(membership);
        }
        purchasedMemberships.push(membership);
      }

      // hide the other membership options if there's already a purchased membership
      // if (activeMemberships.length > 0) {
      //   setMembershipOptions(false);
      // }

      dispatch({
        type: ACTIONS.SET_MEMBERSHIP_DATA,
        data: { activeMemberships, canceledMemberships, purchasedMemberships },
      });

      if (channelName) {
        const activeMembershipForChannel = activeMemberships?.find(
          (membership) => membership.Membership.channel_name === channelName
        );
        dispatch(
          doToast({
            message: __(
              'Congraulations, you are now a "%membership_tier_name%" member of %creator_channel_name%\'s channel, enjoy the perks and special features!',
              {
                membership_tier_name: activeMembershipForChannel.MembershipDetails.name,
                creator_channel_name: channelName,
              }
            ),
          })
        );
      }
    } catch (err) {
      dispatch({
        type: ACTIONS.SET_MEMBERSHIP_DATA_ERROR,
        data: err,
      });
    }
  };
}

export function doMembershipBuy(membershipParams: MembershipParams, cb?: () => void) {
  return async (dispatch: Dispatch, getState: GetState) => {
    try {
      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_STARTED });

      const {
        membership_id: membershipId,
        channel_id: userChannelClaimId,
        channel_name: userChannelName,
        price_id: priceId,
      } = membershipParams;

      // show the memberships the user is subscribed to
      await Lbryio.call(
        'membership',
        'buy',
        {
          environment: stripeEnvironment,
          membership_id: membershipId,
          channel_id: userChannelClaimId,
          channel_name: userChannelName,
          price_id: priceId,
        },
        'post'
      );

      // cleary query params
      // $FlowFixMe
      let newURL = location.href.split('?')[0];
      window.history.pushState('object', document.title, newURL);

      dispatch({ type: ACTIONS.SET_MEMBERSHIP_BUY_SUCCESFUL });
      // callback function
      if (cb) cb();

      // populate the new data and update frontend
      // and send userChannelName as search for response
      // to notify success
      dispatch(doMembershipMine(userChannelName));
    } catch (err) {
      const errorMessage = err.message;
      const subscriptionFailedBackendError = 'failed to create subscription with default card';

      // wait a bit to show the message so it's not jarring for the user
      let errorMessageTimeout = 1150;

      // don't do an error delay if there's already a network error
      if (errorMessage === subscriptionFailedBackendError) {
        errorMessageTimeout = 0;
      }

      setTimeout(() => {
        const genericErrorMessage = __(
          "Sorry, your purchase wasn't able to completed. Please contact support for possible next steps"
        );

        dispatch(
          doToast({
            message: genericErrorMessage,
            isError: true,
          })
        );
      }, errorMessageTimeout);
    }
  };
}

// clear membership data
export function doMembershipDeleteData() {
  return async () => {
    await Lbryio.call(
      'membership',
      'clear',
      {
        environment: 'test',
      },
      'post'
    );

    // $FlowFixMe
    location.reload();
  };
}
