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
  makeSelectTagInClaimOrChannelForUri,
  selectClaimIsMine,
  selectIsNsfwAknowledgedForClaimId,
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
import { selectIsActiveLivestreamForUri, selectChannelIsLiveFetchedForUri } from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectVideoSourceLoadedForUri } from 'redux/selectors/app';

import { doStartFloatingPlayingUri, doClearPlayingUri } from 'redux/actions/content';
import { doFileGetForUri } from 'redux/actions/file';
import { doAknowledgeNsfw } from 'redux/actions/claims';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doMembershipMine, doMembershipList } from 'redux/actions/memberships';

import { NSFW_CONTENT_TAG } from 'constants/tags';

import withStreamClaimRender from './view';

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
    isCurrentClaimLive: selectIsActiveLivestreamForUri(state, uri),
    scheduledState: selectScheduledStateForUri(state, uri),
    playingUri: selectPlayingUri(state),
    playingCollectionId: selectPlayingCollectionId(state),
    pendingFiatPayment: selectPendingFiatPaymentForUri(state, uri),
    sdkFeePending: selectSdkFeePendingForUri(state, uri),
    pendingUnlockedRestrictions: selectPendingUnlockedRestrictionsForUri(state, uri),
    canViewFile: selectCanViewFileForUri(state, uri),
    isNsfw: makeSelectTagInClaimOrChannelForUri(props.uri, NSFW_CONTENT_TAG)(state),
    isNsfwAknowledged: selectIsNsfwAknowledgedForClaimId(state, claimId),
    channelLiveFetched: selectChannelIsLiveFetchedForUri(state, uri),
    sourceLoaded: selectVideoSourceLoadedForUri(state, uri),
    claimIsMine: Boolean(selectClaimIsMine(state, claim)),
  };
};

const perform = {
  doCheckIfPurchasedClaimId,
  doFileGetForUri,
  doMembershipMine,
  doStartFloatingPlayingUri,
  doMembershipList,
  doClearPlayingUri,
  doAknowledgeNsfw,
};

export default (Component) => withRouter(connect(select, perform)(withStreamClaimRender(Component)));
