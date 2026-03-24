import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import {
  selectClaimForUri,
  selectIsUriResolving,
  selectTitleForUri,
  selectDateForUri,
  selectGeoRestrictionForUri,
  selectClaimIsMine,
  selectIsShortForUri,
} from 'redux/selectors/claims';
import { doFileGetForUri } from 'redux/actions/file';
import { selectViewCountForUri, selectBanStateForUri } from 'lbryinc';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { selectFirstItemUrlForCollection } from 'redux/selectors/collections';
import { isClaimNsfw, isStreamPlaceholderClaim } from 'util/claim';
import formatMediaDuration from 'util/formatMediaDuration';
import ClaimPreviewTile from './view';

const select = (state, props) => {
  const claim = props.uri && selectClaimForUri(state, props.uri);
  const media = claim && claim.value && (claim.value.video || claim.value.audio);
  const mediaDuration = media && media.duration && formatMediaDuration(media.duration);
  const isLivestream = isStreamPlaceholderClaim(claim);
  const repostSrcUri = claim && claim.repost_url && claim.canonical_url;
  const isCollection = claim && claim.value_type === 'collection';

  return {
    claim,
    mediaDuration,
    date: props.uri && selectDateForUri(state, props.uri),
    isResolvingUri: props.uri && selectIsUriResolving(state, props.uri),
    claimIsMine: props.uri && selectClaimIsMine(state, claim),
    title: props.uri && selectTitleForUri(state, props.uri),
    banState: selectBanStateForUri(state, props.uri),
    geoRestriction: selectGeoRestrictionForUri(state, props.uri),
    streamingUrl: (repostSrcUri || props.uri) && selectStreamingUrlForUri(state, repostSrcUri || props.uri),
    showMature: selectShowMatureContent(state),
    isMature: claim ? isClaimNsfw(claim) : false,
    isLivestream,
    isLivestreamActive: isLivestream && selectIsActiveLivestreamForUri(state, props.uri),
    viewCount: selectViewCountForUri(state, props.uri),
    disableShortsView: selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW),
    firstCollectionItemUrl: claim && isCollection && selectFirstItemUrlForCollection(state, claim.claim_id),
    defaultCollectionAction: selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION),
    isShort: selectIsShortForUri(state, props.uri),
  };
};

const perform = (dispatch) => ({
  getFile: (uri) => dispatch(doFileGetForUri(uri)),
});

export default connect(select, perform)(ClaimPreviewTile);
