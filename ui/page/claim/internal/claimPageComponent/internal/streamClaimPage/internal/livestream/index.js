import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { getChannelIdFromClaim } from 'util/claim';
import {
  selectActiveLivestreamForChannel,
  selectActiveLivestreamInitialized,
  selectSocketConnectionForId,
} from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';
import { selectIsUriCurrentlyPlaying } from 'redux/selectors/content';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import LivestreamPage from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, canonical_url } = claim || {};
  const channelClaimId = getChannelIdFromClaim(claim);

  return {
    claim,
    chatDisabled: selectCommentsDisabledSettingForChannelId(state, channelClaimId),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    activeLivestreamInitialized: selectActiveLivestreamInitialized(state),
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
