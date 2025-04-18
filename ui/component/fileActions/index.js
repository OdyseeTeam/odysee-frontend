import { connect } from 'react-redux';
import {
  selectClaimIsMine,
  selectClaimForUri,
  selectHasChannels,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimIsNsfwForUri,
  selectPreorderTagForUri,
  selectProtectedContentTagForUri,
  selectIsFiatRequiredForUri,
  selectIsFiatPaidForUri,
  selectPurchaseMadeForClaimId,
  selectCostInfoForUri,
  selectScheduledStateForUri,
} from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { doPrepareEdit } from 'redux/actions/publish';
import { doDownloadUri } from 'redux/actions/content';
import { doToast } from 'redux/actions/notifications';
import { doOpenModal } from 'redux/actions/app';
import FileActions from './view';
import { makeSelectFileRenderModeForUri, selectContentStates } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { DISABLE_DOWNLOAD_BUTTON_TAG, DISABLE_REACTIONS_ALL_TAG, DISABLE_REACTIONS_VIDEO_TAG } from 'constants/tags';
import { isStreamPlaceholderClaim } from 'util/claim';
import * as RENDER_MODES from 'constants/file_render_modes';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const permanentUrl = (claim && claim.permanent_url) || '';
  const isPostClaim = makeSelectFileRenderModeForUri(permanentUrl)(state) === RENDER_MODES.MARKDOWN;

  return {
    claim,
    disableFileReactions:
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_ALL_TAG)(state) ||
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_VIDEO_TAG)(state),
    claimIsMine: selectClaimIsMine(state, claim),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    costInfo: selectCostInfoForUri(state, uri),
    hasChannels: selectHasChannels(state),
    uriAccessKey: selectContentStates(state).uriAccessKeys[uri],
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    isPostClaim,
    streamingUrl: selectStreamingUrlForUri(state, uri),
    disableDownloadButton: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_DOWNLOAD_BUTTON_TAG)(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isAPreorder: Boolean(selectPreorderTagForUri(state, props.uri)),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    isFiatRequired: selectIsFiatRequiredForUri(state, uri),
    isFiatPaid: selectIsFiatPaidForUri(state, uri),
    isFiatPaidAsPurchase: Boolean(selectPurchaseMadeForClaimId(state, claim.claim_id)),
    isTierUnlocked: claim && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim.claim_id),
    scheduledState: selectScheduledStateForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doPrepareEdit,
  doToast,
  doDownloadUri,
};

export default connect(select, perform)(FileActions);
