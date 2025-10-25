import { connect } from 'react-redux';
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
  selectHomepageCustomBanners,
  selectClientSetting,
} from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';

import EmbedHomePage from './view';

const select = (state) => ({
  authenticated: selectUserVerifiedEmail(state),
  followedTags: selectFollowedTags(state),
  subscribedChannelIds: selectSubscriptionIds(state),
  showNsfw: selectShowMatureContent(state),
  homepageData: selectHomepageData(state) || {},
  homepageFetched: selectHomepageFetched(state),
  fetchingActiveLivestreams: selectIsFetchingActiveLivestreams(state),
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  userHasOdyseeMembership: hasLegacyOdyseePremium(state),
  activeLivestreamByCreatorId: selectActiveLivestreamByCreatorId(state),
  livestreamViewersById: selectViewersById(state),
  homepageCustomBanners: selectHomepageCustomBanners(state),
});

const perform = (dispatch) => ({
  doFetchAllActiveLivestreamsForQuery: () => dispatch(doFetchAllActiveLivestreamsForQuery()),
});

export default connect(select, perform)(EmbedHomePage);
