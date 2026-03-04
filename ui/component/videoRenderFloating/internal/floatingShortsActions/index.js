import { connect } from 'react-redux';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { selectClientSetting } from 'redux/selectors/settings';
import { toggleAutoplayNextShort } from 'redux/actions/settings';
import { doSetShortsSidePanel } from 'redux/actions/shorts';
import * as SETTINGS from 'constants/settings';
import FloatingShortsActions from './view';

const select = (state, props) => ({
  myReaction: selectMyReactionForUri(state, props.uri),
  likeCount: selectLikeCountForUri(state, props.uri),
  dislikeCount: selectDislikeCountForUri(state, props.uri),
  autoPlayNextShort: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS),
});

const perform = {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  doToggleShortsAutoplay: toggleAutoplayNextShort,
  doSetShortsSidePanel,
};

export default connect(select, perform)(FloatingShortsActions);
