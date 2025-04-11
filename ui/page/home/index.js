import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doOpenModal } from 'redux/actions/app';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
import {
  selectIsFetchingActiveLivestreams,
  selectActiveLivestreamByCreatorId,
  selectViewersById,
} from 'redux/selectors/livestream';
import { selectFollowedTags } from 'redux/selectors/tags';
import { hasLegacyOdyseePremium, selectHomepageFetched, selectUserVerifiedEmail } from 'redux/selectors/user';
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
  userHasOdyseeMembership: hasLegacyOdyseePremium(state),
  activeLivestreamByCreatorId: selectActiveLivestreamByCreatorId(state),
  livestreamViewersById: selectViewersById(state),
});

const perform = (dispatch) => ({
  doFetchAllActiveLivestreamsForQuery: () => dispatch(doFetchAllActiveLivestreamsForQuery()),
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(HomePage);
