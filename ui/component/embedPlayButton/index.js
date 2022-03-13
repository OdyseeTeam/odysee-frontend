import { connect } from 'react-redux';
import { selectThumbnailForUri, selectClaimForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import * as SETTINGS from 'constants/settings';
import { doFetchCostInfoForUri, selectCostInfoForUri } from 'lbryinc';
import { doPlayUri, doSetPlayingUri, doUriInitiatePlay } from 'redux/actions/content';
import { doAnaltyicsPurchaseEvent } from 'redux/actions/app';
import { selectClientSetting } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { isStreamPlaceholderClaim } from 'util/claim';

import ChannelThumbnail from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  return {
    thumbnail: selectThumbnailForUri(state, uri),
    claim,
    floatingPlayerEnabled: selectClientSetting(state, SETTINGS.FLOATING_PLAYER),
    costInfo: selectCostInfoForUri(state, uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
  };
};

const perform = {
  doResolveUri,
  doFetchCostInfoForUri,
  doPlayUri,
  doSetPlayingUri,
  doAnaltyicsPurchaseEvent,
  doUriInitiatePlay,
};

export default connect(select, perform)(ChannelThumbnail);
