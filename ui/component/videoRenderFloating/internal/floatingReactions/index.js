import { connect } from 'react-redux';
import { selectMyReactionForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import FloatingReactions from './view';

const select = (state, props) => ({
  myReaction: selectMyReactionForUri(state, props.uri),
});

const perform = {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
};

export default connect(select, perform)(FloatingReactions);
