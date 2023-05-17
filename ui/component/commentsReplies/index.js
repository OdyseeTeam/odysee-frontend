import { connect } from 'react-redux';
import { selectIsFetchingCommentsForParentId, selectRepliesForParentId } from 'redux/selectors/comments';
import CommentsReplies from './view';

const select = (state, props) => {
  const { parentId } = props;

  return {
    fetchedReplies: selectRepliesForParentId(state, parentId),
    isFetching: selectIsFetchingCommentsForParentId(state, parentId),
  };
};

export default connect(select)(CommentsReplies);
