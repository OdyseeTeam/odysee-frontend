import { buildURI } from 'util/lbryURI';
import { connect } from 'react-redux';
import { doCommentSocketConnectAsCommenter, doCommentSocketDisconnectAsCommenter } from 'redux/actions/websocket';
import { doResolveUri } from 'redux/actions/claims';
import { selectClaimForUri, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import { selectIfUnauthorizedForContent } from 'redux/selectors/memberships';

import PopoutChatPage from './view';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { channelName, streamName } = params;

  const uri = buildURI({ channelName: channelName.replace(':', '#'), streamName: streamName.replace(':', '#') }) || '';

  const claim = selectClaimForUri(state, uri);

  return {
    claim,
    uri,
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    unauthorizedForContent: selectIfUnauthorizedForContent(state, claim),
  };
};

const perform = {
  doCommentSocketConnectAsCommenter,
  doCommentSocketDisconnectAsCommenter,
  doResolveUri,
};

export default connect(select, perform)(PopoutChatPage);
