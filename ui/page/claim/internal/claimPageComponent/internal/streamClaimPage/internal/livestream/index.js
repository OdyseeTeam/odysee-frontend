import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { selectClaimForUri } from 'redux/selectors/claims';
import { selectSocketConnectionForId, selectChatCommentsDisabledForUri } from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectIsUriCurrentlyPlaying } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';

import LivestreamPage from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, canonical_url } = claim || {};

  return {
    claim,
    chatDisabled: selectChatCommentsDisabledForUri(state, uri),
    isStreamPlaying: selectIsUriCurrentlyPlaying(state, uri),
    socketConnection: selectSocketConnectionForId(state, claimId),
    theaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    uri: canonical_url || '',
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
  };
};

const perform = {
  doCommentSocketConnect,
  doCommentSocketDisconnect,
};

export default connect(select, perform)(LivestreamPage);
