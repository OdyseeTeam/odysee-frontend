// @flow
import { COL_TYPES, SECTION_TAGS, WATCH_LATER_ID, FAVORITES_ID, QUEUE_ID } from 'constants/collections';
import { getCurrentTimeInSec } from 'util/time';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';

export const defaultCollectionState: Collection = {
  id: '',
  name: '',
  title: '',
  items: [],
  itemCount: 0,
  createdAt: getCurrentTimeInSec(),
  updatedAt: getCurrentTimeInSec(),
  type: 'collection',
};

export function getClaimIdsInCollectionClaim(claim: ?CollectionClaim) {
  if (!claim) return claim;
  // $FlowFixMe
  return claim.value.claims || (claim.claims && claim.claims.map((claim) => claim.claim_id)) || [];
}

export function claimToStoredCollection(claim: CollectionClaim) {
  const storedCollection: Collection = Object.assign({}, defaultCollectionState);

  const claimIds = getClaimIdsInCollectionClaim(claim);

  Object.assign(storedCollection, {
    id: claim.claim_id,
    name: claim.value.title,
    title: claim.value.title,
    items: claimIds || [],
    itemCount: claimIds ? claimIds.length : 0,
    description: claim.value.description,
    thumbnail: claim.value.thumbnail,
    createdAt: claim.meta.creation_timestamp,
    updatedAt: claim.timestamp,
    type: resolveCollectionType(claim.value.tags),
  });

  return storedCollection;
}

export const getItemCountForCollection = (collection: Collection) => {
  if (!collection) return collection;

  return collection.items && collection.items.length;
};

/**
 * Determines the overall type for a particular collection.
 *
 * Pass in the set of `claim::value_type` and `claim::stream_type` for all
 * entries in that collection.
 *
 * 'COL_TYPES.COLLECTION', I believe, is the placeholder for mixed-type collection.
 *
 * @param tags
 * @param valueTypes
 * @param streamTypes
 * @returns {string}
 */
export function resolveCollectionType(
  tags: ?Array<string>,
  valueTypes: Set<string> = new Set(),
  streamTypes: Set<string> = new Set()
): CollectionType {
  if (
    valueTypes.size === 1 &&
    valueTypes.has('stream') &&
    ((streamTypes.size === 1 && (streamTypes.has('audio') || streamTypes.has('video'))) ||
      (streamTypes.size === 2 && streamTypes.has('audio') && streamTypes.has('video')))
  ) {
    return COL_TYPES.PLAYLIST;
  }

  if (tags && tags.includes(SECTION_TAGS.FEATURED_CHANNELS)) {
    return COL_TYPES.FEATURED_CHANNELS;
  }

  return COL_TYPES.COLLECTION;
}

export function resolveAuxParams(collectionType: ?string, collectionClaim: Claim) {
  const auxParams = {};

  switch (collectionType) {
    case COL_TYPES.PLAYLIST:
    case COL_TYPES.CHANNELS:
    case COL_TYPES.COLLECTION:
      // No additional params
      break;

    case COL_TYPES.FEATURED_CHANNELS:
      auxParams.featuredChannelsParams = {
        channelId: collectionClaim.signing_channel?.claim_id,
      };
      break;

    default:
      // $FlowIgnore
      console.error(`resolveAuxParams: unhandled type: ${collectionType}`); // eslint-disable-line no-console
      break;
  }

  return auxParams;
}

export function getTitleForCollection(collection: ?Collection) {
  if (!collection) return collection;

  return collection.title || collection.name;
}

export function getLocalizedNameForCollectionId(collectionId: string) {
  switch (collectionId) {
    case WATCH_LATER_ID:
      return __('Watch Later');
    case FAVORITES_ID:
      return __('Favorites');
    case QUEUE_ID:
      return __('Queue');
    default:
      return null;
  }
}

export function isClaimAllowedForCollection(claim: ?StreamClaim) {
  if (claim) {
    const streamType = claim.value?.stream_type;
    const isPlayable = streamType && (streamType === 'audio' || streamType === 'video');

    // Ideally, unlisted and scheduled (if started) claims should be allowed,
    // but the decision is to disable for now for simplicity.
    if (isPlayable) {
      if (!isClaimUnlisted(claim) && !isClaimPrivate(claim)) {
        const ss: ClaimScheduledState = getClaimScheduledState(claim);
        return ss === 'non-scheduled' || ss === 'started';
      }
    }
  }
  return false;
}
