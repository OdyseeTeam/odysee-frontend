import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doOpenModal } from 'redux/actions/app';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
import { selectIsFetchingActiveLivestreams, selectFilteredActiveLivestreamUris } from 'redux/selectors/livestream';
import { selectFollowedTags } from 'redux/selectors/tags';
import { selectHomepageFetched, selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectUserHasValidOdyseeMembership, selectUserHasOdyseePremiumPlus } from 'redux/selectors/memberships';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import {
  selectShowMatureContent,
  selectHomepageData,
  selectClientSetting,
  selectHomepageMeme,
} from 'redux/selectors/settings';

import HomePage from './view';

const select = (state) => ({
  followedTags: selectFollowedTags(state),
  subscribedChannelIds: selectSubscriptionIds(state),
  authenticated: selectUserVerifiedEmail(state),
  showNsfw: selectShowMatureContent(state),
  homepageData: selectHomepageData(state) || {},
  homepageMeme: selectHomepageMeme(state),
  homepageFetched: selectHomepageFetched(state),
  fetchingActiveLivestreams: selectIsFetchingActiveLivestreams(state),
  hideScheduledLivestreams: selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS),
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  userHasOdyseeMembership: selectUserHasValidOdyseeMembership(state),
  hasPremiumPlus: selectUserHasOdyseePremiumPlus(state),
  getActiveLivestreamUrisForIds: (channelIds) => selectFilteredActiveLivestreamUris(state, channelIds),
});

const perform = (dispatch) => ({
  doFetchAllActiveLivestreamsForQuery: () => dispatch(doFetchAllActiveLivestreamsForQuery()),
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(HomePage);
