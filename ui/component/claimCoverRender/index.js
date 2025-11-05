import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { getThumbnailFromClaim } from 'util/claim';
import { selectShortsSidePanelOpen} from 'redux/selectors/shorts';
import { selectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';

import ClaimCoverRender from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  return {
    claimThumbnail: getThumbnailFromClaim(claim),
    isMature: selectClaimIsNsfwForUri(state, uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    sidePanelOpen: selectShortsSidePanelOpen(state),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
  };
};

export default connect(select)(ClaimCoverRender);
