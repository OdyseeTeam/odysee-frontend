// @flow
import { MATURE_TAGS, MEMBERS_ONLY_CONTENT_TAG, SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';
import { parseURI } from 'util/lbryURI';

const matureTagMap = MATURE_TAGS.reduce((acc, tag) => ({ ...acc, [tag]: true }), {});

export const isClaimNsfw = (claim: Claim): boolean => {
  if (!claim) {
    throw new Error('No claim passed to isClaimNsfw()');
  }

  if (!claim.value) {
    return false;
  }

  const tags = claim.value.tags || [];
  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i].toLowerCase();
    if (matureTagMap.hasOwnProperty(tag)) {
      return true;
    }
  }

  return false;
};

export function createNormalizedClaimSearchKey(options: ClaimSearchOptions) {
  // Ignore page because we don't care what the last page searched was, we want everything
  // Ignore release_time because that will change depending on when you call claim_search ex: release_time: ">12344567"
  const { page: optionToIgnoreForQuery, release_time: anotherToIgnore, ...rest } = options;
  const query = JSON.stringify(rest);
  return query;
}

export function concatClaims(claimList: Array<Claim> = [], concatClaimList: Array<any> = []): Array<Claim> {
  if (!claimList || claimList.length === 0) {
    if (!concatClaimList) {
      return [];
    }
    return concatClaimList.slice();
  }

  const claims = claimList.slice();
  concatClaimList.forEach((claim) => {
    if (!claims.some((item) => item.claim_id === claim.claim_id)) {
      claims.push(claim);
    }
  });

  return claims;
}

export function filterClaims(claims: Array<Claim>, query: ?string): Array<Claim> {
  if (query) {
    const queryMatchRegExp = new RegExp(query, 'i');
    return claims.filter((claim) => {
      const { value } = claim;

      return (
        (value.title && value.title.match(queryMatchRegExp)) ||
        (claim.signing_channel && claim.signing_channel.name.match(queryMatchRegExp)) ||
        (claim.name && claim.name.match(queryMatchRegExp))
      );
    });
  }

  return claims;
}

/**
 * Determines if the claim is a channel.
 *
 * @param claim
 * @param uri An abandoned claim will be null, so provide the `uri` as a fallback to parse.
 */
export function isChannelClaim(claim: ?Claim, uri?: string) {
  // 1. parseURI can't resolve a repost's channel, so a `claim` will be needed.
  // 2. parseURI is still needed to cover the case of abandoned claims.
  if (claim) {
    return claim.value_type === 'channel';
  } else if (uri) {
    try {
      return Boolean(parseURI(uri).isChannel);
    } catch (err) {
      return false;
    }
  } else {
    return false;
  }
}

export function isCanonicalUrl(uri: string) {
  let streamName, streamClaimId, channelName, channelClaimId;
  try {
    ({ streamName, streamClaimId, channelName, channelClaimId } = parseURI(uri));
  } catch (error) {}

  return Boolean(streamName && streamClaimId && channelName && channelClaimId);
}

export function isPermanentUrl(uri: string) {
  let streamName, streamClaimId, channelName;
  try {
    ({ streamName, streamClaimId, channelName } = parseURI(uri));
  } catch (error) {}

  return Boolean(streamName && streamClaimId && !channelName);
}

export function getChannelIdFromClaim(claim: ?Claim) {
  if (claim) {
    if (claim.value_type === 'channel') {
      return claim.claim_id;
    } else if (claim.signing_channel) {
      return claim.signing_channel.claim_id;
    }
  }
}

export const getNameFromClaim = (claim: ?Claim) => claim && claim.name;

export function getChannelNameFromClaim(claim: ?Claim) {
  const channelFromClaim = getChannelFromClaim(claim);
  return getNameFromClaim(channelFromClaim);
}

export function getChannelTitleFromClaim(claim: ?Claim) {
  const channelFromClaim = getChannelFromClaim(claim);
  const value = getClaimMetadata(channelFromClaim);
  return (value && value.title) || getNameFromClaim(channelFromClaim);
}

export function getChannelFromClaim(claim: ?Claim) {
  return !claim ? null : claim.value_type === 'channel' ? claim : claim.signing_channel; // && claim.is_channel_signature_valid
  // ? claim.signing_channel
  // : null;
}

export function getChannelPermanentUrlFromClaim(claim: ?Claim) {
  const channelFromClaim = getChannelFromClaim(claim);
  return channelFromClaim && channelFromClaim.permanent_url;
}

export function getClaimMetadata(claim: ?Claim) {
  const metadata = claim && claim.value;
  return metadata || (claim === undefined ? undefined : null);
}

export function getClaimTags(claim: ?Claim) {
  const metadata = getClaimMetadata(claim);
  return metadata && metadata.tags;
}

export function claimContainsTag(claim: ?Claim, tag: string) {
  const metadata = getClaimMetadata(claim);
  if (metadata && metadata.tags) {
    return metadata.tags.includes(tag);
  }
  return false;
}

export function isClaimProtected(claim: ?Claim) {
  const tags = getClaimTags(claim);
  return tags && tags.includes(MEMBERS_ONLY_CONTENT_TAG);
}

export function isClaimUnlisted(claim: ?Claim) {
  const tags = getClaimTags(claim);
  return tags ? tags.includes(VISIBILITY_TAGS.UNLISTED) : false;
}

export function isClaimPrivate(claim: ?Claim) {
  const tags = getClaimTags(claim);
  return tags ? tags.includes(VISIBILITY_TAGS.PRIVATE) : false;
}

export function getClaimScheduledState(claim: ?Claim): ClaimScheduledState {
  const tags = getClaimTags(claim);
  if (tags && (tags.includes(SCHEDULED_TAGS.SHOW) || tags.includes(SCHEDULED_TAGS.HIDE))) {
    // $FlowFixMe
    const releaseTime = claim?.value?.release_time;
    if (releaseTime) {
      return Date.now() > releaseTime * 1000 ? 'started' : 'scheduled';
    } else {
      assert(false, 'scheduled claim without a release date');
      return 'scheduled';
    }
  }

  return 'non-scheduled';
}

export function getClaimTitle(claim: ?Claim) {
  const metadata = getClaimMetadata(claim);
  return metadata && metadata.title;
}

export function getClaimVideoInfo(claim: ?Claim) {
  const metadata = getClaimMetadata(claim);
  // $FlowFixMe
  return metadata && metadata.video;
}

export function getVideoClaimAspectRatio(claim: ?Claim) {
  const { width: claimWidth, height: claimHeight } = getClaimVideoInfo(claim) || {};

  // some might not have these values, so default to 16:9
  const width = claimWidth || 1920;
  const height = claimHeight || 1080;

  return height / width;
}

export const isStreamPlaceholderClaim = (claim: ?StreamClaim) => {
  return claim ? Boolean(claim.value_type === 'stream' && !claim.value.source) : false;
};

export const getThumbnailFromClaim = (claim: ?Claim) => {
  if (!claim) return claim;

  const { thumbnail } = claim.value || {};

  return thumbnail && thumbnail.url ? thumbnail.url.trim().replace(/^http:\/\//i, 'https://') : null;
};

export const isClaimShort = (claim: ?Claim): boolean => {
  if (!claim || !claim.value) return false;

  const value: any = claim.value;
  const media: any = value.video || value.audio;
  if (!media) return false;

  const SHORTS_MAX_DURATION = 180;
  const duration = Number(media.duration);
  const isShortDuration = isFinite(duration) && duration <= SHORTS_MAX_DURATION;
  if (!isShortDuration) return false;

  const width = Number(media.width);
  const height = Number(media.height);
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return false;

  const aspectRatio = width / height;

  const MAX_VERTICAL_RATIO = 0.9;

  const isVerticalOrNear = aspectRatio <= MAX_VERTICAL_RATIO;

  return isVerticalOrNear;
};
export const getClaimMeta = (claim: ?Claim) => claim && claim.meta;
export const getClaimRepostedAmount = (claim: ?Claim) => getClaimMeta(claim)?.reposted;
