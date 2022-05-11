import { connect } from 'react-redux';
import { selectClaimIsMineForUri } from 'redux/selectors/claims';
import { selectRepliesForParentId } from 'redux/selectors/comments';
import CommentsReplies from './view';

const select = (state, props) => {
  const { uri, parentId } = props;

  return {
    fetchedReplies: selectRepliesForParentId(state, parentId),
    claimIsMine: selectClaimIsMineForUri(state, uri),
  };
};

export default connect(select)(CommentsReplies);
