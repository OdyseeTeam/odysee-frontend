import { connect } from 'react-redux';
import EmbedWrapperPage from './view';
import * as PAGES from 'constants/pages';
import { selectClaimForUri, selectIsUriResolving, selectLatestClaimForUri } from 'redux/selectors/claims';
import { doFetchLatestClaimForChannel } from 'redux/actions/claims';
import { buildURI, normalizeURI } from 'util/lbryURI';
import { getChannelIdFromClaim, isStreamPlaceholderClaim, getChannelFromClaim } from 'util/claim';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectLatestLiveClaimForChannel, selectLatestLiveUriForChannel } from 'redux/selectors/livestream';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { selectFirstItemUrlForCollection } from 'redux/selectors/collections';
import { doFetchItemsInCollection } from 'redux/actions/collections';

const select = (state, props) => {
  const { search, hash } = state.router.location;
  const { match } = props || {};
  const { pathname } = state.router.location || {};

  const matchedPath = match ? buildMatchWithHash(match, hash) : buildMatchFromPath(pathname);
  let uri = getUriFromMatch(matchedPath);

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');

  // Detect playlist page URLs (e.g., /$/playlist/:collectionId or /$/embed/playlist/:collectionId)
  let playlistCollectionId = null;
  const playlistMatch = pathname && pathname.match(/\/\$\/(?:embed\/)?playlist\/([a-f0-9]{40})/i);
  if (playlistMatch) {
    playlistCollectionId = playlistMatch[1];
  }

  const claim = selectClaimForUri(state, uri);
  const { canonical_url: canonicalUrl } = claim || {};
  const claimId = claim?.claim_id;

  const channelClaim = getChannelFromClaim(claim);
  const channelClaimId = getChannelIdFromClaim(claim);
  const { canonical_url: channelUri } = channelClaim || {};

  const latestContentClaim =
    featureParam === PAGES.LIVE_NOW
      ? selectLatestLiveClaimForChannel(state, channelClaimId)
      : selectLatestClaimForUri(state, canonicalUrl);

  const latestClaimUrl =
    featureParam === PAGES.LIVE_NOW
      ? selectLatestLiveUriForChannel(state, channelClaimId)
      : latestContentClaim && latestContentClaim.canonical_url;
  const latestClaimId = latestContentClaim && latestContentClaim.claim_id;

  if (latestClaimUrl) uri = latestClaimUrl;

  // Detect collections from playlist-style URIs even if claim isn't resolved as a collection
  let detectedCollectionId = playlistCollectionId;
  if (!detectedCollectionId && uri && typeof uri === 'string' && uri.toLowerCase().includes('/playlist')) {
    const collectionIdMatch = uri.match(/[#:/]([0-9a-f]{40})/i);
    if (collectionIdMatch) detectedCollectionId = collectionIdMatch[1];
  }

  const isCollection = (claim && claim.value_type === 'collection') || Boolean(detectedCollectionId);
  const collectionId = claim && claim.value_type === 'collection' ? claim.claim_id : detectedCollectionId;
  const collectionFirstItemUri = collectionId ? selectFirstItemUrlForCollection(state, collectionId) : null;
  const renderMode = uri ? makeSelectFileRenderModeForUri(uri)(state) : undefined;

  return {
    uri,
    claimId,
    latestClaimId,
    canonicalUrl,
    channelUri,
    channelClaimId,
    isCollection,
    collectionId,
    collectionFirstItemUri,
    renderMode,
    latestClaimUrl,
    isResolvingUri: uri && selectIsUriResolving(state, uri),
    isLivestreamClaim: featureParam === PAGES.LIVE_NOW || isStreamPlaceholderClaim(claim),
    contentUnlocked: claim && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim.claim_id),
  };
};

const perform = {
  doFetchChannelIsLiveForId,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
  doFetchLatestClaimForChannel,
  doFetchItemsInCollection,
};

export default connect(select, perform)(EmbedWrapperPage);

function getUriFromMatch(match) {
  if (match && match.params) {
    const { claimName, claimId } = match.params || {};

    if (!claimName) {
      return '';
    }

    // Special case: don't resolve "home" as a claim (it has its own route)
    if (claimName === 'home' && !claimId) {
      return '';
    }

    // https://{DOMAIN}/claimName/claimId
    const isOldPermanentUriFormat =
      typeof claimName === 'string' &&
      !claimName.startsWith('@') &&
      !claimName.includes(':') &&
      !claimName.includes('#') &&
      claimId;

    // https://{DOMAIN}/channelName/claimName/
    // on match channelName = claimName / claimName = claimId
    const isCanonicalUriFormat = !isOldPermanentUriFormat;

    if (isOldPermanentUriFormat) {
      try {
        return buildURI({ claimName, claimId });
      } catch (error) {}
    }

    if (isCanonicalUriFormat) {
      return normalizeURI(String(claimName) + '/' + (claimId || ''));
    }
  }

  return '';
}

function buildMatchWithHash(match, hash) {
  const matchedPath = Object.assign({}, match);

  // Ensure params object exists
  if (!matchedPath.params) {
    matchedPath.params = {};
  }

  // if a claim is using the hash canonical format ("lbry://@chanelName#channelClaimId/streamName#streamClaimId"
  // instead of "lbry://@chanelName:channelClaimId/streamName:streamClaimId")
  if (hash && hash.length > 0 && matchedPath.params) {
    // the hash is on the channel part of the uri
    if (hash.includes('/')) {
      const newClaimNameParam = matchedPath.params.claimName;
      const claimIdPart = hash.substring(0, hash.indexOf('/'));

      if (newClaimNameParam && !newClaimNameParam.includes(claimIdPart)) {
        matchedPath.params.claimName = newClaimNameParam + claimIdPart;
        matchedPath.params.claimId = hash.substring(hash.indexOf('/') + 1);
      }
    } else {
      // the hash is on the stream part of the uri, so it looks like
      // "lbry://@chanelName:channelClaimId/streamName#streamClaimId" instead of
      // "lbry://@chanelName:channelClaimId/streamName:streamClaimId"
      matchedPath.params.claimId = (matchedPath.params.claimId || '') + hash;
    }
  }

  return matchedPath;
}

function buildMatchFromPath(pathname) {
  const matchedPath = { params: {} };
  try {
    if (!pathname) return matchedPath;
    const parts = pathname.split('/').filter(Boolean);
    // Expect ['$', 'embed', <claimName>, <claimId>?]
    const embedIdx = parts.indexOf('embed');
    if (embedIdx > -1) {
      const claimName = decodeURIComponent(parts[embedIdx + 1] || '');
      const claimId = decodeURIComponent(parts[embedIdx + 2] || '');
      matchedPath.params.claimName = claimName;
      if (claimId) matchedPath.params.claimId = claimId;
    }
  } catch (e) {}
  return matchedPath;
}
