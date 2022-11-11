import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  selectClaimForUri,
  selectIsUriResolving,
  selectClaimIsMine,
  makeSelectClaimIsPending,
  selectGeoRestrictionForUri,
  selectLatestClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectFirstItemUrlForCollection,
  selectAreCollectionItemsFetchingForId,
} from 'redux/selectors/collections';
import { selectHomepageFetched, selectUserVerifiedEmail } from 'redux/selectors/user';
import { doResolveUri, doResolveClaimId, doFetchLatestClaimForChannel } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectBlacklistedOutpointMap, selectFilteredOutpointMap } from 'lbryinc';
import { selectActiveLiveClaimForChannel } from 'redux/selectors/livestream';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import { doFetchCreatorSettings } from 'redux/actions/comments';
import { selectSettingsForChannelId } from 'redux/selectors/comments';
import { doFetchItemsInCollection } from 'redux/actions/collections';
import { PREFERENCE_EMBED } from 'constants/tags';

import withResolvedClaimRender from 'hocs/withResolvedClaimRender';

import ClaimPageComponent from './view';

const select = (state, props) => {
  const { uri, location, liveContentPath } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);

  const claim = selectClaimForUri(state, uri);
  const channelClaimId = getChannelIdFromClaim(claim);
  const collectionId =
    urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID) ||
    (claim && claim.value_type === 'collection' && claim.claim_id) ||
    null;

  const { canonical_url: canonicalUrl, claim_id: claimId } = claim || {};
  const latestContentClaim = liveContentPath
    ? selectActiveLiveClaimForChannel(state, claimId)
    : selectLatestClaimForUri(state, canonicalUrl);
  const latestClaimUrl = latestContentClaim && latestContentClaim.canonical_url;
  const preferEmbed = makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state);

  return {
    uri,
    claim,
    channelClaimId,
    latestClaimUrl,
    preferEmbed,
    isResolvingUri: selectIsUriResolving(state, uri),
    blackListedOutpointMap: selectBlacklistedOutpointMap(state),
    filteredOutpointMap: selectFilteredOutpointMap(state),
    isSubscribed: selectIsSubscribedForUri(state, uri),
    claimIsMine: selectClaimIsMine(state, claim),
    claimIsPending: makeSelectClaimIsPending(uri)(state),
    collection: selectCollectionForId(state, collectionId),
    collectionId,
    collectionFirstItemUri: selectFirstItemUrlForCollection(state, collectionId),
    isResolvingCollection: selectAreCollectionItemsFetchingForId(state, collectionId),
    isAuthenticated: selectUserVerifiedEmail(state),
    geoRestriction: selectGeoRestrictionForUri(state, uri),
    homepageFetched: selectHomepageFetched(state),
    creatorSettings: selectSettingsForChannelId(state, channelClaimId),
  };
};

const perform = {
  doResolveUri,
  doBeginPublish,
  doResolveClaimId,
  doOpenModal,
  fetchLatestClaimForChannel: doFetchLatestClaimForChannel,
  fetchChannelLiveStatus: doFetchChannelLiveStatus,
  doFetchCreatorSettings,
  doFetchItemsInCollection,
};

export default withResolvedClaimRender(withRouter(connect(select, perform)(ClaimPageComponent)));
