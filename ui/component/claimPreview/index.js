import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectIsUriResolving,
  selectClaimIsMine,
  makeSelectClaimIsPending,
  makeSelectReflectingClaimForUri,
  selectTitleForUri,
  selectDateForUri,
  selectGeoRestrictionForUri,
  selectThumbnailForUri,
} from 'redux/selectors/claims';

import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { selectCollectionIsMine, selectFirstItemUrlForCollection } from 'redux/selectors/collections';

import { doResolveUri } from 'redux/actions/claims';
import { doFileGetForUri } from 'redux/actions/file';
import { selectBanStateForUri } from 'lbryinc';
import { selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import { selectLanguage, selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { makeSelectHasVisitedUri } from 'redux/selectors/content';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { isClaimNsfw, isStreamPlaceholderClaim } from 'util/claim';
import ClaimPreview from './view';
import formatMediaDuration from 'util/formatMediaDuration';
import { doClearContentHistoryUri, doPlayNextUri } from 'redux/actions/content';
import * as SETTINGS from 'constants/settings';

const select = (state, props) => {
  const claim = props.uri && selectClaimForUri(state, props.uri);
  const media = claim && claim.value && (claim.value.video || claim.value.audio);
  const mediaDuration = media && media.duration && formatMediaDuration(media.duration);
  const isLivestream = isStreamPlaceholderClaim(claim);
  const repostSrcUri = claim && claim.repost_url && claim.canonical_url;
  const isCollection = claim && claim.value_type === 'collection';

  return {
    banState: selectBanStateForUri(state, props.uri),
    claim,
    claimIsMine: props.uri && selectClaimIsMine(state, claim),
    date: props.uri && selectDateForUri(state, props.uri),
    geoRestriction: selectGeoRestrictionForUri(state, props.uri),
    hasVisitedUri: props.uri && makeSelectHasVisitedUri(props.uri)(state),
    isCollectionMine: selectCollectionIsMine(state, props.collectionId),
    isLivestream,
    isLivestreamActive: isLivestream && selectIsActiveLivestreamForUri(state, props.uri),
    isResolvingRepost: props.uri && selectIsUriResolving(state, props.repostUrl),
    isResolvingUri: props.uri && selectIsUriResolving(state, props.uri),
    isSubscribed: props.uri && selectIsSubscribedForUri(state, props.uri),
    lang: selectLanguage(state),
    mediaDuration,
    nsfw: claim ? isClaimNsfw(claim) : false,
    obscureNsfw: selectShowMatureContent(state) === false,
    pending: props.uri && makeSelectClaimIsPending(props.uri)(state),
    reflectingProgress: props.uri && makeSelectReflectingClaimForUri(props.uri)(state),
    streamingUrl: (repostSrcUri || props.uri) && selectStreamingUrlForUri(state, repostSrcUri || props.uri),
    title: props.uri && selectTitleForUri(state, props.uri),
    firstCollectionItemUrl: claim && isCollection && selectFirstItemUrlForCollection(state, claim.claim_id),
    thumbnailFromClaim: selectThumbnailForUri(state, props.uri),
    defaultCollectionAction: selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION),
  };
};

const perform = (dispatch) => ({
  resolveUri: (uri) => dispatch(doResolveUri(uri)),
  getFile: (uri) => dispatch(doFileGetForUri(uri)),
  doClearContentHistoryUri: (uri) => dispatch(doClearContentHistoryUri(uri)),
  doPlayNextUri: (playingOptions) => dispatch(doPlayNextUri(playingOptions)),
});

export default connect(select, perform)(ClaimPreview);
