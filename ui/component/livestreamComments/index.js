import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doCommentList, doSuperChatList } from 'redux/actions/comments';
import {
  selectTopLevelCommentsForUri,
  selectIsFetchingComments,
  selectSuperChatsForUri,
  selectSuperChatTotalAmountForUri,
  selectPinnedCommentsForUri,
} from 'redux/selectors/comments';
import LivestreamComments from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    fetchingComments: selectIsFetchingComments(state),
    superChats: selectSuperChatsForUri(state, uri),
    superChatsTotalAmount: selectSuperChatTotalAmountForUri(state, uri),
  };
};

export default connect(select, {
  doCommentList,
  doSuperChatList,
  doResolveUris,
})(LivestreamComments);
