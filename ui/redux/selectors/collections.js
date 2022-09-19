// @flow
import * as COLLECTIONS_CONSTS from 'constants/collections';

import { createSelector } from 'reselect';
import { COL_TYPES } from 'constants/collections';
import moment from 'moment';
import {
  selectClaimForUri,
  selectClaimsById,
  selectClaimIdsByUri,
  selectMyCollectionClaims,
  selectCollectionClaimsById,
  selectMyCollectionClaimsById,
} from 'redux/selectors/claims';
import { normalizeURI } from 'util/lbryURI';
import { createCachedSelector } from 're-reselect';
import { selectUserCreationDate } from 'redux/selectors/user';
import { selectPlayingCollection } from 'redux/selectors/content';
import { getItemCountForCollection } from 'util/collections';
import { getChannelIdFromClaim } from 'util/claim';

type State = { claims: any, user: any, collections: CollectionState };

const selectState = (state: State) => state.collections || {};

export const selectSavedCollectionIds = (state: State) => selectState(state).savedIds;
export const selectBuiltinCollections = (state: State) => selectState(state).builtin;
export const selectMyUnpublishedCollections = (state: State) => selectState(state).unpublished;
export const selectMyEditedCollections = (state: State) => selectState(state).edited;
export const selectMyUpdatedCollections = (state: State) => selectState(state).updated;
export const selectCollectionItemsFetchingIds = (state: State) => selectState(state).collectionItemsFetchingIds;
export const selectQueueCollection = (state: State) => selectState(state).queue;
export const selectCurrentQueueList = (state: State) => ({ queue: selectQueueCollection(state) });
export const selectFeaturedChannelsPublishing = (state: State) => selectState(state).featuredChannelsPublishing;
export const selectLastUsedCollection = (state: State) => selectState(state).lastUsedCollection;
export const selectIsFetchingMyCollectionClaims = (state: State) => selectState(state).isFetchingMyCollectionClaims;
export const selectCollectionIdsWithItemsResolved = (state: State) => selectState(state).resolvedIds;

export const selectCollectionHasItemsResolvedForId = (state: State, id: string) =>
  new Set(selectCollectionIdsWithItemsResolved(state)).has(id);

export const selectUnpublishedCollectionsList = createSelector(
  selectMyUnpublishedCollections,
  (unpublishedCollections) => Object.keys(unpublishedCollections)
);

export const selectIsCollectionSavedForId = (state: State, id: string) =>
  new Set(selectSavedCollectionIds(state)).has(id);

export const selectSavedCollections = createSelector(
  selectCollectionClaimsById,
  selectSavedCollectionIds,
  (byId, savedIds) => {
    const savedCollections = {};

    savedIds.forEach((savedId) => {
      if (byId[savedId]) savedCollections[savedId] = byId[savedId];
    });

    return savedCollections;
  }
);

export const selectHasCollections = (state: State) => {
  const unpublishedCollections = selectUnpublishedCollectionsList(state);
  const publishedCollectionIds = selectMyCollectionClaims(state);

  return unpublishedCollections.length > 0 || (publishedCollectionIds && publishedCollectionIds.length > 0);
};

export const selectEditedCollectionForId = (state: State, id: string) => selectMyEditedCollections(state)[id];
export const selectCollectionHasEditsForId = (state: State, id: string) =>
  Boolean(selectEditedCollectionForId(state, id));

export const selectUpdatedCollectionForId = (state: State, id: string) => {
  const editedCollections = selectMyEditedCollections(state);
  if (editedCollections[id]) return editedCollections[id];

  const updatedCollections = selectMyUpdatedCollections(state);
  return updatedCollections[id];
};

export const selectCollectionDescriptionForId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection?.description;
};

export const selectPublishedCollectionForId = (state: State, id: string) => selectCollectionClaimsById(state)[id];

export const selectUnpublishedCollectionForId = (state: State, id: string) => selectMyUnpublishedCollections(state)[id];

export const selectIsCollectionPrivateForId = (state: State, id: string) => {
  const unpublishedCollection = selectUnpublishedCollectionForId(state, id);
  if (unpublishedCollection) return true;

  const builtinIds = selectBuiltinCollections(state);
  if (builtinIds[id]) return true;

  const queue = selectCurrentQueueList(state);
  if (queue[id]) return true;

  return false;
};

export const selectCollectionIsMineForId = (state: State, id: string) => {
  const isPrivate = selectIsCollectionPrivateForId(state, id);
  if (isPrivate) return true;

  const publicIds = selectMyCollectionClaims(state);
  if (publicIds && new Set(publicIds).has(id)) return true;

  return false;
};

// returns published collections + local edits or update timestamps
export const selectMyPublicLocalCollections = createSelector(
  selectMyCollectionClaimsById,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  (myCollectionsById, edited, updated) => {
    const myPublicLocalCollections = {};

    for (const id in myCollectionsById) {
      const collection = myCollectionsById[id];
      const updatedCollection = updated[id];
      const editedCollection = edited[id];

      myPublicLocalCollections[id] = Object.assign({}, collection);

      if (updatedCollection) {
        Object.assign(myPublicLocalCollections[id], updatedCollection);
      } else if (editedCollection) {
        Object.assign(myPublicLocalCollections[id], editedCollection);
      }
    }

    return myPublicLocalCollections;
  }
);

export const selectMyPublicCollectionForId = (state: State, id: string) => selectMyCollectionClaimsById(state)[id];

export const selectIsMyPublicCollectionNotEditedForId = (state: State, id: string) => {
  const publicCollection = selectMyPublicCollectionForId(state, id);
  const hasEdits = selectCollectionHasEditsForId(state, id);

  return Boolean(publicCollection && !hasEdits);
};

export const selectMyPublicCollectionCountForId = (state: State, id: string) =>
  getItemCountForCollection(selectMyPublicCollectionForId(state, id));

export const selectIsCollectionItemsFetchingForId = (state: State, id: string) =>
  new Set(selectCollectionItemsFetchingIds(state)).has(id);

export const selectCollectionForId = createSelector(
  (state, id) => id,
  selectPublishedCollectionForId,
  selectBuiltinCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectCurrentQueueList,
  (id, published, bLists, uLists, eLists, queue) => {
    const collection = bLists[id] || uLists[id] || eLists[id] || published || queue[id];
    return collection;
  }
);

export const selectIsCollectionBuiltInForId = (state: State, id: string) => selectBuiltinCollections(state)[id];

export const selectClaimSavedForUrl = createSelector(
  (state, url) => url,
  selectBuiltinCollections,
  selectMyPublicLocalCollections,
  selectMyPublicLocalCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  (url, bLists, myRLists, uLists, eLists) => {
    const collections = [bLists, uLists, eLists, myRLists];

    // $FlowFixMe
    return collections.some((list) => Object.values(list).some(({ items }) => items?.some((item) => item === url)));
  }
);

export const selectCollectionForIdHasClaimUrl = createCachedSelector(
  (state, id, uri) => uri,
  selectCollectionForId,
  (url, collection) => Boolean(collection && new Set(collection.items).has(url))
)((state, id, url) => `${String(url)}:${String(id)}`);

export const selectUrlsForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  // -- sanitize -- > in case non-urls got added into a collection: only select string types
  // to avoid general app errors trying to use its uri
  return collection && collection.items && collection.items.filter((item) => typeof item === 'string');
};

export const selectBrokenUrlsForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  // Allows removing non-standard uris from a collection
  return collection && collection.items && collection.items.filter((item) => typeof item !== 'string');
};

export const selectFirstItemUrlForCollectionId = (state: State, id: string) => {
  const collectionItemUrls = selectUrlsForCollectionId(state, id);

  return collectionItemUrls?.length > 0 && collectionItemUrls[0];
};

export const selectCollectionLengthForId = (state: State, id: string) => {
  const urls = selectUrlsForCollectionId(state, id);
  return urls?.length || 0;
};

export const selectCollectionIsEmptyForId = (state: State, id: string) => {
  const length = selectCollectionLengthForId(state, id);
  return length === 0;
};

export const selectAreBuiltinCollectionsEmpty = (state: State) => {
  const notEmpty = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.some((collectionKey) => {
    if (collectionKey !== COLLECTIONS_CONSTS.QUEUE_ID) {
      const length = selectCollectionLengthForId(state, collectionKey);
      return length > 0;
    }
  });

  return !notEmpty;
};

export const selectClaimIdsForCollectionId = createSelector(
  selectCollectionForId,
  selectClaimIdsByUri,
  (collection, byUri) => {
    const items = (collection && collection.items && collection.items.filter(Boolean)) || [];

    const ids = new Set([]);
    for (const item of items) {
      let claimId;
      try {
        claimId = byUri[normalizeURI(item)];
      } catch (e) {}

      if (claimId) {
        ids.add(claimId);
      }
    }

    return Array.from(ids);
  }
);

export const selectIndexForUrlInCollection = createSelector(
  (state, url, id, ignoreShuffle) => ignoreShuffle,
  (state, url, id) => id,
  (state, url, id) => selectUrlsForCollectionId(state, id),
  (state, url) => url,
  (state) => selectPlayingCollection(state),
  selectClaimForUri,
  (ignoreShuffle, id, urls, url, playingCollection, claim) => {
    const { collectionId: playingCollectionId, shuffle } = playingCollection;

    const shuffleUrls = !ignoreShuffle && shuffle && playingCollectionId === id && shuffle.newUrls;
    const listUrls = shuffleUrls || urls;

    const index = listUrls && listUrls.findIndex((u) => u === url);
    if (index > -1) {
      return index;
    } else if (claim) {
      const index = listUrls && listUrls.findIndex((u) => u === claim.permanent_url);
      if (index > -1) return index;
    }
    return null;
  }
);

export const selectPreviousUrlForCollectionAndUrl = createCachedSelector(
  (state, url, id) => id,
  (state) => selectPlayingCollection(state),
  (state, url, id) => selectIndexForUrlInCollection(state, url, id),
  (state, url, id) => selectUrlsForCollectionId(state, id),
  (id, playingCollection, index, urls) => {
    const { collectionId: playingCollectionId, shuffle, loop } = playingCollection;

    const loopList = loop && playingCollectionId === id;
    const shuffleUrls = shuffle && playingCollectionId === id && shuffle.newUrls;
    const listUrls = shuffleUrls || urls;

    if (index > -1 && listUrls) {
      let nextUrl;
      if (index === 0 && loopList) {
        nextUrl = listUrls[listUrls.length - 1];
      } else {
        nextUrl = listUrls[index - 1];
      }
      return nextUrl || null;
    } else {
      return null;
    }
  }
)((state, url, id) => `${String(url)}:${String(id)}`);

export const selectNextUrlForCollectionAndUrl = createCachedSelector(
  (state, url, id) => id,
  (state) => selectPlayingCollection(state),
  (state, url, id) => selectIndexForUrlInCollection(state, url, id),
  (state, url, id) => selectUrlsForCollectionId(state, id),
  (id, playingCollection, index, urls) => {
    const { collectionId: playingCollectionId, shuffle, loop } = playingCollection;

    const loopList = loop && playingCollectionId === id;
    const shuffleUrls = shuffle && playingCollectionId === id && shuffle.newUrls;
    const listUrls = shuffleUrls || urls;

    if (index > -1 && listUrls) {
      // We'll get the next playble url
      let remainingUrls = listUrls.slice(index + 1);
      if (!remainingUrls.length && loopList) {
        remainingUrls = listUrls.slice(0);
      }
      const nextUrl = remainingUrls && remainingUrls[0];
      return nextUrl || null;
    } else {
      return null;
    }
  }
)((state, url, id) => `${String(url)}:${String(id)}`);

export const selectTitleForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return (collection && (collection.title || collection.name)) || '';
};

export const selectThumbnailForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection && collection.thumbnail?.url;
};

export const selectUpdatedAtForCollectionId = createSelector(
  selectCollectionForId,
  selectUserCreationDate,
  selectUpdatedCollectionForId,
  (collection, userCreatedAt, updated) => {
    const collectionUpdatedAt = (updated?.updatedAt || collection?.updatedAt || 0) * 1000;

    const userCreationDate = moment(userCreatedAt).format('MMMM DD YYYY');
    const collectionUpdatedDate = moment(collectionUpdatedAt).format('MMMM DD YYYY');

    // Collection updated time can't be older than account creation date
    if (moment(collectionUpdatedDate).diff(moment(userCreationDate)) < 0) {
      return userCreatedAt;
    }

    return collectionUpdatedAt || '';
  }
);

export const selectCreatedAtForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  const isBuiltin = new Set(COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS).has(id);

  if (isBuiltin) {
    const userCreatedAt = selectUserCreationDate(state);
    return userCreatedAt;
  }

  if (collection?.createdAt) return collection.createdAt * 1000;

  return null;
};

export const selectCountForCollectionId = (state: State, id: string) =>
  getItemCountForCollection(selectCollectionForId(state, id));

export const selectFeaturedChannelsByChannelId = createSelector(
  selectMyUnpublishedCollections,
  selectCollectionClaimsById,
  selectClaimsById,
  (privateLists, publicLists, claimsById) => {
    let results: { [ChannelId]: Array<CollectionId> } = {};

    function addToResults(channelId, collectionId) {
      if (results[channelId]) {
        const ids = results[channelId];
        // $FlowIgnore
        if (!ids.some((id) => id === collectionId)) {
          ids.push(collectionId);
        }
      } else {
        results[channelId] = [collectionId];
      }
    }

    Object.values(privateLists).forEach((col) => {
      // $FlowIgnore
      const { type, featuredChannelsParams, id } = col;
      if (type === COL_TYPES.FEATURED_CHANNELS && featuredChannelsParams?.channelId) {
        addToResults(featuredChannelsParams.channelId, id);
      }
    });

    Object.values(publicLists).forEach((col) => {
      // $FlowIgnore
      const { type, id } = col;
      if (type === COL_TYPES.FEATURED_CHANNELS) {
        const channelId = getChannelIdFromClaim(claimsById[id]);
        if (channelId) {
          addToResults(channelId, id);
        }
      }
    });

    return results;
  }
);

function flatten(ary, ret = []) {
  // Array.flat() support not available in obscure browsers.
  for (const entry of ary) {
    if (Array.isArray(entry)) {
      flatten(entry, ret);
    } else {
      ret.push(entry);
    }
  }
  return ret;
}

export const selectFeaturedChannelsIds = createSelector(selectFeaturedChannelsByChannelId, (byChannelId) => {
  // $FlowIgnore mixed
  const values: Array<Array<CollectionId>> = Object.values(byChannelId);
  return flatten(values);
});

export const selectCollectionTypeForId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection?.type;
};

export const selectCollectionKeyForId = (state: State, id: string) => {
  const isQueue = id === COLLECTIONS_CONSTS.QUEUE_ID;
  if (isQueue) return COLLECTIONS_CONSTS.QUEUE_ID;

  const unpublishedCollection = selectUnpublishedCollectionForId(state, id);
  if (unpublishedCollection) return COLLECTIONS_CONSTS.KEYS.UNPUBLISHED;

  const editedCollection = selectEditedCollectionForId(state, id);
  if (editedCollection) return COLLECTIONS_CONSTS.KEYS.EDITED;

  const isBuiltin = new Set(COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS).has(id);
  if (isBuiltin) return COLLECTIONS_CONSTS.KEYS.BUILTIN;

  const updated = selectUpdatedCollectionForId(state, id);
  if (updated) return COLLECTIONS_CONSTS.KEYS.UPDATED;

  return undefined;
};
