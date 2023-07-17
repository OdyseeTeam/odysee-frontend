import { connect } from 'react-redux';
import EmbedWrapperPage from './view';
import * as PAGES from 'constants/pages';
import { selectClaimForUri, selectIsUriResolving, selectLatestClaimForUri } from 'redux/selectors/claims';
import { doFetchLatestClaimForChannel } from 'redux/actions/claims';
import { buildURI, normalizeURI } from 'util/lbryURI';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectLatestLiveClaimForChannel, selectLatestLiveUriForChannel } from 'redux/selectors/livestream';
import { isStreamPlaceholderClaim, getChannelFromClaim } from 'util/claim';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

const select = (state, props) => {
  const { search, hash } = state.router.location;
  const { match } = props || {};

  const matchedPath = buildMatchWithHash(match, hash);
  let uri = getUriFromMatch(matchedPath);

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');

  const claim = selectClaimForUri(state, uri);
  const { canonical_url: canonicalUrl } = claim || {};
  const claimId = claim?.claim_id;

  const channelClaim = getChannelFromClaim(claim);
  const { claim_id: channelClaimId, canonical_url: channelUri } = channelClaim || {};

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

  return {
    uri,
    claimId,
    latestClaimId,
    canonicalUrl,
    channelUri,
    channelClaimId,
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
};

export default connect(select, perform)(EmbedWrapperPage);

function getUriFromMatch(match) {
  if (match) {
    const { claimName, claimId } = match.params;

    // https://{DOMAIN}/claimName/claimId
    const isOldPermanentUriFormat =
      !claimName.startsWith('@') && !claimName.includes(':') && !claimName.includes('#') && claimId;

    // https://{DOMAIN}/channelName/claimName/
    // on match channelName = claimName / claimName = claimId
    const isCanonicalUriFormat = !isOldPermanentUriFormat;

    if (isOldPermanentUriFormat) {
      try {
        return buildURI({ claimName, claimId });
      } catch (error) {}
      try {
        return buildURI({ claimName, claimId });
      } catch (error) {}
      // ^-------- why twice?
    }

    if (isCanonicalUriFormat) {
      return normalizeURI(claimName + '/' + (claimId || ''));
    }
  }

  return '';
}

function buildMatchWithHash(match, hash) {
  const matchedPath = Object.assign({}, match);

  // if a claim is using the hash canonical format ("lbry://@chanelName#channelClaimId/streamName#streamClaimId"
  // instead of "lbry://@chanelName:channelClaimId/streamName:streamClaimId")
  if (hash && hash.length > 0) {
    // the hash is on the channel part of the uri
    if (hash.includes('/')) {
      const newClaimNameParam = matchedPath.params.claimName;
      const claimIdPart = hash.substring(0, hash.indexOf('/'));

      if (!newClaimNameParam.includes(claimIdPart)) {
        matchedPath.params.claimName = newClaimNameParam + claimIdPart;
        matchedPath.params.claimId = hash.substring(hash.indexOf('/') + 1);
      }
    } else {
      // the hash is on the stream part of the uri, so it looks like
      // "lbry://@chanelName:channelClaimId/streamName#streamClaimId" instead of
      // "lbry://@chanelName:channelClaimId/streamName:streamClaimId"
      matchedPath.params.claimId = matchedPath.params.claimId + hash;
    }
  }

  return matchedPath;
}
