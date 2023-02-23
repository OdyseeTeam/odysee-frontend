import { connect } from 'react-redux';

import { selectIsMarkdownPostForUri } from 'redux/selectors/content';
import { selectIsStreamPlaceholderForUri, selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';

import ClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    isMarkdownPost: selectIsMarkdownPostForUri(state, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    chatDisabled: selectCommentsDisabledSettingForChannelId(state, selectChannelClaimIdForUri(state, uri)),
  };
};

export default connect(select)(ClaimPage);
