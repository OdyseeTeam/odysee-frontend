import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { SIDEBAR_SUBS_DISPLAYED } from 'constants/subscriptions';
import { doFetchLastActiveSubs } from 'redux/actions/subscriptions';
import {
  selectLastActiveSubscriptions,
  selectSubscriptionUris,
  selectSubscriptions,
} from 'redux/selectors/subscriptions';
import { doClearClaimSearch, doResolveUris } from 'redux/actions/claims';
import { doClearPurchasedUriSuccess } from 'redux/actions/file';
import { selectFollowedTags } from 'redux/selectors/tags';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { doOpenModal, doSignOut } from 'redux/actions/app';
import { selectUnseenNotificationCount } from 'redux/selectors/notifications';
import { selectClaimsByUri, selectPurchaseUriSuccess } from 'redux/selectors/claims';
import { selectUserHasValidOdyseeMembership } from 'redux/selectors/memberships';

import SideNavigation from './view';

// ****************************************************************************
// doGetDisplayedSubs
// ****************************************************************************

function doGetDisplayedSubs(filter) {
  return async (dispatch, getState) => {
    const state = getState();
    const claimsByUri = selectClaimsByUri(state);
    const subs = selectSubscriptions(state);
    const lastActiveSubs = selectLastActiveSubscriptions(state);
    let filteredSubs = [];

    if (subs) {
      if (filter) {
        const f = filter.toLowerCase();

        subs.forEach((sub) => {
          const claim = claimsByUri[sub?.uri];
          if (claim) {
            if (claim.name.toLowerCase().includes(f) || claim.value?.title?.toLowerCase().includes(f)) {
              filteredSubs.push(sub);
            }
          }
        });
      } else {
        filteredSubs = lastActiveSubs?.length > 0 ? lastActiveSubs : subs.slice(0, SIDEBAR_SUBS_DISPLAYED);
      }
    }

    return filteredSubs;
  };
}

// ****************************************************************************
// SideNavigation
// ****************************************************************************

const select = (state) => ({
  subscriptions: selectSubscriptions(state),
  lastActiveSubs: selectLastActiveSubscriptions(state),
  followedTags: selectFollowedTags(state),
  email: selectUserVerifiedEmail(state),
  purchaseSuccess: selectPurchaseUriSuccess(state),
  unseenCount: selectUnseenNotificationCount(state),
  user: selectUser(state),
  homepageData: selectHomepageData(state) || {},
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  homepageOrderApplyToSidebar: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER_APPLY_TO_SIDEBAR),
  hasMembership: selectUserHasValidOdyseeMembership(state),
  subscriptionUris: selectSubscriptionUris(state) || [],
});

export default connect(select, {
  doClearClaimSearch,
  doSignOut,
  doFetchLastActiveSubs,
  doClearPurchasedUriSuccess,
  doOpenModal,
  doGetDisplayedSubs,
  doResolveUris,
})(SideNavigation);
