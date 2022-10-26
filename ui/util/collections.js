// @flow
import { COL_TYPES, SECTION_TAGS } from 'constants/collections';

export const getItemCountForCollection = (collection: Collection) => {
  if (!collection) return collection;

  if (Number.isInteger(collection.itemCount)) return collection.itemCount;

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
  valueTypes: Set<string>,
  streamTypes: Set<string>
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
