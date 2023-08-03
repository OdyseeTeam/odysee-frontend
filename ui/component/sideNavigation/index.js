import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import SideNavigation from './view';
import * as SETTINGS from 'constants/settings';
import { SIDEBAR_SUBS_DISPLAYED } from 'constants/subscriptions';
import { getSortedRowData } from 'page/home/helper';
import { doBeginPublish } from 'redux/actions/publish';
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
import { selectClientSettings, selectHomepageData } from 'redux/selectors/settings';
import { doOpenModal, doSignOut } from 'redux/actions/app';
import { selectUnseenNotificationCount } from 'redux/selectors/notifications';
import { selectClaimsByUri, selectPurchaseUriSuccess } from 'redux/selectors/claims';
import { selectUserHasValidOdyseeMembership } from 'redux/selectors/memberships';
import { GetLinksData } from 'util/buildHomepage';

// ****************************************************************************
// selectSidebarCategories
// ****************************************************************************

const selectSidebarCategories = createSelector(
  selectHomepageData,
  selectClientSettings,
  selectUserVerifiedEmail,
  selectUserHasValidOdyseeMembership,
  (homepageData, clientSettings, email, hasMembership) => {
    const applyHomepageOrderToSidebar = clientSettings[SETTINGS.HOMEPAGE_ORDER_APPLY_TO_SIDEBAR];
    const homepageOrder = clientSettings[SETTINGS.HOMEPAGE_ORDER];

    const isLargeScreen = false; // we don't care about tile count, just want categories.
    const rowData = GetLinksData(homepageData || {}, isLargeScreen);
    let categories = rowData;

    if (applyHomepageOrderToSidebar) {
      const sortedRowData /* : Array<RowDataItem> */ = getSortedRowData(
        Boolean(email),
        hasMembership,
        homepageOrder,
        homepageData,
        rowData
      );
      categories = sortedRowData.filter((x) => x.id !== 'FYP' && x.id !== 'BANNER' && x.id !== 'PORTALS');
    }

    return categories.map(({ pinnedUrls, pinnedClaimIds, hideByDefault, hideSort, ...theRest }) => theRest);
  }
);

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
  sidebarCategories: selectSidebarCategories(state),
  lastActiveSubs: selectLastActiveSubscriptions(state),
  followedTags: selectFollowedTags(state),
  email: selectUserVerifiedEmail(state),
  purchaseSuccess: selectPurchaseUriSuccess(state),
  unseenCount: selectUnseenNotificationCount(state),
  user: selectUser(state),
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
  doBeginPublish,
})(SideNavigation);
