import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import * as SETTINGS from 'constants/settings';

import {
  selectClaimForUri,
  selectIsFetchingPurchases,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectIsStreamPlaceholderForUri,
  selectPendingFiatPaymentForUri,
  selectSdkFeePendingForUri,
  selectScheduledStateForUri,
  // selectClaimWasPurchasedForUri,
  // selectIsFiatPaidForUri,
} from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import {
  makeSelectFileRenderModeForUri,
  selectPlayingUri,
  selectPlayingCollectionId,
  selectCanViewFileForUri,
} from 'redux/selectors/content';
import { selectMembershipMineFetched, selectPendingUnlockedRestrictionsForUri } from 'redux/selectors/memberships';
import {
  selectIsActiveLivestreamForUri,
  selectIsActiveLivestreamForClaimId,
  selectActiveLivestreamForChannel,
  selectChannelIsLiveFetchedForUri,
} from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectVideoSourceLoadedForUri } from 'redux/selectors/app';

import { doStartFloatingPlayingUri, doClearPlayingUri } from 'redux/actions/content';
import { doFileGetForUri } from 'redux/actions/file';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doMembershipMine, doMembershipList } from 'redux/actions/memberships';

import withStreamClaimRender from './view';

// Reduce needless rerenders from object identity changes (e.g. playingUri)
// Only re-render when the specific fields used by the HOC actually change.
function areStatePropsEqual(prev, next) {
  // Fast path for reference equality
  if (prev === next) return true;

  // Compare the frequently-changing nested object by fields actually used
  const prevPU = prev.playingUri || {};
  const nextPU = next.playingUri || {};

  const prevPUUri = prevPU.uri;
  const nextPUUri = nextPU.uri;
  if (prevPUUri !== nextPUUri) return false;

  const prevSourceId = prevPU.sourceId;
  const nextSourceId = nextPU.sourceId;
  if (prevSourceId !== nextSourceId) return false;

  const prevColId = (prevPU.collection && prevPU.collection.collectionId) || undefined;
  const nextColId = (nextPU.collection && nextPU.collection.collectionId) || undefined;
  if (prevColId !== nextColId) return false;

  // For the remaining props, do a shallow equality check.
  const keys = Object.keys(prev);
  if (keys.length !== Object.keys(next).length) return false;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k === 'playingUri') continue; // handled above
    if (prev[k] !== next[k]) return false;
  }
  return true;
}

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, signing_channel: channelClaim, value_type: valueType } = claim || {};
  const { name: channelName, claim_id: channelClaimId } = channelClaim || {};

  // let sdkPaid = selectClaimWasPurchasedForUri(state, props.uri);
  // let fiatPaid = selectIsFiatPaidForUri(state, props.uri);

  return {
    channelName,
    channelClaimId,
    claimId,
    myMembershipsFetched: selectMembershipMineFetched(state),
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    rentalTag: selectRentalTagForUri(state, props.uri),
    autoplay: selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA),
    isFetchingPurchases: selectIsFetchingPurchases(state),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    streamingUrl: selectStreamingUrlForUri(state, uri),
    isCollectionClaim: valueType === 'collection',
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    isCurrentClaimLive:
      selectIsActiveLivestreamForUri(state, uri) ||
      selectIsActiveLivestreamForClaimId(state, claimId) ||
      Boolean(selectActiveLivestreamForChannel(state, channelClaimId)),
    scheduledState: selectScheduledStateForUri(state, uri),
    playingUri: selectPlayingUri(state),
    playingCollectionId: selectPlayingCollectionId(state),
    pendingFiatPayment: selectPendingFiatPaymentForUri(state, uri),
    sdkFeePending: selectSdkFeePendingForUri(state, uri),
    pendingUnlockedRestrictions: selectPendingUnlockedRestrictionsForUri(state, uri),
    canViewFile: selectCanViewFileForUri(state, uri),
    channelLiveFetched: selectChannelIsLiveFetchedForUri(state, uri),
    sourceLoaded: selectVideoSourceLoadedForUri(state, uri),
  };
};

const perform = {
  doCheckIfPurchasedClaimId,
  doFileGetForUri,
  doMembershipMine,
  doStartFloatingPlayingUri,
  doMembershipList,
  doClearPlayingUri,
};

export default (Component) =>
  withRouter(connect(select, perform, null, { areStatePropsEqual })(withStreamClaimRender(Component)));
