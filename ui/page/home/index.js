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
import { selectHomepageFetched, selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import * as COLLECTIONS from 'constants/collections';
import {
  selectShowMatureContent,
  selectHomepageData,
  selectClientSetting,
  selectHomepageMeme,
  selectHomepageCustomBanners,
} from 'redux/selectors/settings';
import { selectCountForCollectionIdNonDeleted, selectUrlsForCollectionIdNonDeleted } from 'redux/selectors/collections';
import { doFetchItemsInCollection } from 'redux/actions/collections';

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
  activeLivestreamByCreatorId: selectActiveLivestreamByCreatorId(state),
  livestreamViewersById: selectViewersById(state),
  homepageCustomBanners: selectHomepageCustomBanners(state),
  watchLaterCount: selectCountForCollectionIdNonDeleted(state, COLLECTIONS.WATCH_LATER_ID),
  watchLaterUris: selectUrlsForCollectionIdNonDeleted(state, COLLECTIONS.WATCH_LATER_ID),
});

const perform = (dispatch) => ({
  doFetchAllActiveLivestreamsForQuery: () => dispatch(doFetchAllActiveLivestreamsForQuery()),
  doFetchItemsInCollection: (params) => dispatch(doFetchItemsInCollection(params)),
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(HomePage);
