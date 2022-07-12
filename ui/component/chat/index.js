import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri, selectClaimsByUri } from 'redux/selectors/claims';
import { doCommentList, doSuperChatList } from 'redux/actions/comments';
import {
  selectTopLevelCommentsForUri,
  selectSuperChatsForUri,
  selectPinnedCommentsForUri,
} from 'redux/selectors/comments';
import { selectThemePath } from 'redux/selectors/settings';
import { doFetchUserMemberships } from 'redux/actions/user';
import ChatLayout from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    claimId: claim && claim.claim_id,
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    superChats: selectSuperChatsForUri(state, uri),
    theme: selectThemePath(state),
    claimsByUri: selectClaimsByUri(state),
  };
};

const perform = {
  doCommentList,
  doSuperChatList,
  doResolveUris,
  doFetchUserMemberships,
};

export default connect(select, perform)(ChatLayout);
