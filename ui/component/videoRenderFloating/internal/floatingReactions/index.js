import { connect } from 'react-redux';
import { selectMyReactionForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import {
  DISABLE_SLIMES_VIDEO_TAG,
  DISABLE_SLIMES_ALL_TAG,
  DISABLE_REACTIONS_ALL_TAG,
  DISABLE_REACTIONS_VIDEO_TAG,
} from 'constants/tags';
import FloatingReactions from './view';

const select = (state, props) => ({
  myReaction: selectMyReactionForUri(state, props.uri),
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
};

export default connect(select, perform)(FloatingReactions);
