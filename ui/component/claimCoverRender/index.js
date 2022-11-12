import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { getThumbnailFromClaim } from 'util/claim';

import { selectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';

import { doUriInitiatePlay } from 'redux/actions/content';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';

import ClaimCoverRender from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  return {
    claimThumbnail: getThumbnailFromClaim(claim),
    isMature: selectClaimIsNsfwForUri(state, uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
  };
};

const perform = {
  doUriInitiatePlay,
  doFetchChannelLiveStatus,
};

export default connect(select, perform)(ClaimCoverRender);
