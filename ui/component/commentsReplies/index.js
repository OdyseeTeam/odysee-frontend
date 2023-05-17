// @flow
import type { Props } from './view';
import CommentsReplies from './view';
import { connect } from 'react-redux';
import { selectIsFetchingCommentsForParentId, selectRepliesForParentId } from 'redux/selectors/comments';

const select = (state, props) => {
  const { parentId } = props;

  return {
    fetchedReplies: selectRepliesForParentId(state, parentId),
    isFetching: selectIsFetchingCommentsForParentId(state, parentId),
  };
};

export default connect<_, Props, _, _, _, _>(select, {})(CommentsReplies);
