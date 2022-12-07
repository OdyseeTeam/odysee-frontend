import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { selectClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';
import { selectHyperChatsForUri } from 'redux/selectors/comments';
import { selectClientSetting } from 'redux/selectors/settings';
import {
  selectViewersForId,
  selectChatCommentsDisabledForUri,
  selectClaimIsActiveChannelLivestreamForUri,
  selectShowScheduledLiveInfoForUri,
  selectActiveStreamUriForClaimUri,
} from 'redux/selectors/livestream';

import LivestreamLayout from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;

  return {
    claim,
    thumbnail: selectThumbnailForUri(state, uri),
    chatDisabled: selectChatCommentsDisabledForUri(state, uri),
    superChats: selectHyperChatsForUri(state, uri),
    activeViewers: claimId && selectViewersForId(state, claimId),
    isCurrentClaimLive: selectClaimIsActiveChannelLivestreamForUri(state, uri),
    showScheduledInfo: selectShowScheduledLiveInfoForUri(state, uri),
    activeStreamUri: selectActiveStreamUriForClaimUri(state, uri),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
  };
};

export default connect(select)(LivestreamLayout);
