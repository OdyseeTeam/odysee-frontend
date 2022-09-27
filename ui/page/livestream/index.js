import { connect } from 'react-redux';
import { selectClaimForUri, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import { doSetPrimaryUri } from 'redux/actions/content';
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
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import { doGetMembershipTiersForContentClaimId } from 'redux/actions/memberships';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import LivestreamPage from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, canonical_url } = claim || {};
  const channelClaimId = getChannelIdFromClaim(claim);

  return {
    chatDisabled: selectCommentsDisabledSettingForChannelId(state, channelClaimId),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    activeLivestreamInitialized: selectActiveLivestreamInitialized(state),
    channelClaimId,
    isStreamPlaying: selectIsUriCurrentlyPlaying(state, uri),
    socketConnection: selectSocketConnectionForId(state, claimId),
    theaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    uri: canonical_url || '',
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
  };
};

const perform = {
  doSetPrimaryUri,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
  doFetchChannelLiveStatus,
  doGetMembershipTiersForContentClaimId,
};

export default connect(select, perform)(LivestreamPage);
