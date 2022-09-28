import { connect } from 'react-redux';
import {
  selectClaimIsMine,
  selectClaimForUri,
  selectHasChannels,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimIsNsfwForUri,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
} from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { doPrepareEdit } from 'redux/actions/publish';
import { selectCostInfoForUri } from 'lbryinc';
import { doDownloadUri } from 'redux/actions/content';
import { doToast } from 'redux/actions/notifications';
import { doOpenModal } from 'redux/actions/app';
import FileActions from './view';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { DISABLE_DOWNLOAD_BUTTON_TAG } from 'constants/tags';
import { isStreamPlaceholderClaim } from 'util/claim';
import * as RENDER_MODES from 'constants/file_render_modes';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const permanentUrl = (claim && claim.permanent_url) || '';
  const isPostClaim = makeSelectFileRenderModeForUri(permanentUrl)(state) === RENDER_MODES.MARKDOWN;

  return {
    claim,
    claimIsMine: selectClaimIsMine(state, claim),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    costInfo: selectCostInfoForUri(state, uri),
    hasChannels: selectHasChannels(state),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    isPostClaim,
    streamingUrl: selectStreamingUrlForUri(state, uri),
    disableDownloadButton: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_DOWNLOAD_BUTTON_TAG)(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isAPreorder: Boolean(selectPreorderTagForUri(state, props.uri)),
    isPurchasableContent: Boolean(selectPurchaseTagForUri(state, props.uri)),
    isRentableContent: Boolean(selectRentalTagForUri(state, props.uri)),
  };
};

const perform = {
  doOpenModal,
  doPrepareEdit,
  doToast,
  doDownloadUri,
};

export default connect(select, perform)(FileActions);
