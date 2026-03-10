import { connect } from 'react-redux';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { selectClientSetting } from 'redux/selectors/settings';
import { toggleAutoplayNextShort } from 'redux/actions/settings';
import { doSetShortsSidePanel } from 'redux/actions/shorts';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { doChannelSubscribe, doChannelUnsubscribe } from 'redux/actions/subscriptions';
import { selectPermanentUrlForUri, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import {
  DISABLE_SLIMES_VIDEO_TAG,
  DISABLE_SLIMES_ALL_TAG,
  DISABLE_REACTIONS_ALL_TAG,
  DISABLE_REACTIONS_VIDEO_TAG,
} from 'constants/tags';
import FloatingShortsActions from './view';

const select = (state, props) => ({
  myReaction: selectMyReactionForUri(state, props.uri),
  likeCount: selectLikeCountForUri(state, props.uri),
  dislikeCount: selectDislikeCountForUri(state, props.uri),
  autoPlayNextShort: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS),
  isSubscribed: props.channelUrl ? selectIsSubscribedForUri(state, props.channelUrl) : false,
  channelPermanentUrl: props.channelUrl ? selectPermanentUrlForUri(state, props.channelUrl) : undefined,
  disableSlimes:
    makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_SLIMES_ALL_TAG)(state) ||
    makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_SLIMES_VIDEO_TAG)(state),
  disableReactions:
    makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_REACTIONS_ALL_TAG)(state) ||
    makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_REACTIONS_VIDEO_TAG)(state),
});

const perform = {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  doToggleShortsAutoplay: toggleAutoplayNextShort,
  doSetShortsSidePanel,
  doChannelSubscribe,
  doChannelUnsubscribe,
};

export default connect(select, perform)(FloatingShortsActions);
