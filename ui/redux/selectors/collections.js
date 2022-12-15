// @flow
import moment from 'moment';

import * as COLLECTIONS_CONSTS from 'constants/collections';

import { createSelector } from 'reselect';
import { COLLECTION_PAGE } from 'constants/urlParams';
import {
  selectClaimForUri,
  selectClaimsById,
  selectClaimIdsByUri,
  selectMyCollectionClaimIds,
  selectResolvedCollectionsById,
  selectMyCollectionClaimsById,
  selectClaimIsMineForId,
} from 'redux/selectors/claims';
import { normalizeURI } from 'util/lbryURI';
import { createCachedSelector } from 're-reselect';
import { selectUserCreationDate } from 'redux/selectors/user';
import {
  selectIsCollectionPlayingForId,
  selectCollectionForIdIsPlayingShuffle,
  selectCollectionForIdIsPlayingLoop,
} from 'redux/selectors/content';
import { getItemCountForCollection } from 'util/collections';
import { isPermanentUrl, isCanonicalUrl } from 'util/claim';

type State = { claims: any, user: any, content: any, collections: CollectionState };

const selectState = (state: State) => state.collections || {};

export const selectSavedCollectionIds = (state: State) => selectState(state).savedIds;
export const selectBuiltinCollections = (state: State) => selectState(state).builtin;
export const selectMyUnpublishedCollections = (state: State) => selectState(state).unpublished;
export const selectMyEditedCollections = (state: State) => selectState(state).edited;
export const selectMyUpdatedCollections = (state: State) => selectState(state).updated;
export const selectCollectionItemsFetchingIds = (state: State) => selectState(state).collectionItemsFetchingIds;
export const selectQueueCollection = (state: State) => selectState(state).queue;
export const selectLastUsedCollection = (state: State) => selectState(state).lastUsedCollection;
export const selectIsFetchingMyCollections = (state: State) => selectState(state).isFetchingMyCollections;
export const selectCollectionIdsWithItemsResolved = (state: State) => selectState(state).resolvedIds;
export const selectThumbnailClaimsFetchingCollectionIds = (state: State) =>
  selectState(state).thumbnailClaimsFetchingCollectionIds;

export const selectAreThumbnailClaimsFetchingForCollectionIds = (state: State, ids: string) =>
  selectThumbnailClaimsFetchingCollectionIds(state).includes(ids);

export const selectCollectionHasItemsResolvedForId = (state: State, id: string) =>
  new Set(selectCollectionIdsWithItemsResolved(state)).has(id);

export const selectUnpublishedCollectionsList = createSelector(
  selectMyUnpublishedCollections,
  (unpublishedCollections) => Object.keys(unpublishedCollections)
);

export const selectCollectionSavedForId = (state: State, id: string) =>
  new Set(selectSavedCollectionIds(state)).has(id);

export const selectSavedCollections = createSelector(
  selectResolvedCollectionsById,
  selectSavedCollectionIds,
  (resolvedCollectionsById, savedIds) => {
    const savedCollections = {};

    savedIds.forEach((savedId) => {
      const savedCollectionClaim = resolvedCollectionsById[savedId];
      if (savedCollectionClaim) savedCollections[savedId] = savedCollectionClaim;
    });

    return savedCollections;
  }
);

export const selectHasLocalSyncCollections = createSelector(
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectSavedCollections,
  (unpublished, edited, saved) => {
    const unpublishedCollectionsList = (Object.keys(unpublished || {}): any);
    const editedList = (Object.keys(edited || {}): any);
    const savedList = (Object.keys(saved || {}): any);

    return unpublishedCollectionsList.length > 0 || editedList.length > 0 || savedList.length > 0;
  }
);

export const selectHasCollections = (state: State) => {
  const hasLocalSyncCollections = selectHasLocalSyncCollections(state);
  const publishedCollectionIds = selectMyCollectionClaimIds(state);

  return hasLocalSyncCollections || (publishedCollectionIds && publishedCollectionIds.length > 0);
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

export const selectCollectionTitleForId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return (collection && (collection.title || collection.name)) || '';
};

export const selectCollectionDescriptionForId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection?.description;
};

export const selectResolvedCollectionForId = (state: State, id: string) => selectResolvedCollectionsById(state)[id];

export const selectUnpublishedCollectionForId = (state: State, id: string) => selectMyUnpublishedCollections(state)[id];

export const selectCollectionIsMine = (state: State, id: string) => {
  const isPrivate = selectHasPrivateCollectionForId(state, id);
  if (isPrivate) return true;

  const publicIds = selectMyCollectionClaimIds(state);
  if (publicIds && publicIds.includes(id)) return true;

  return selectClaimIsMineForId(state, id);
};

export const selectMyPublishedCollections = createSelector(
  selectMyCollectionClaimsById,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  (myCollections, edited, updated) => {
    const myPublishedCollections = Object.assign({}, myCollections);

    // now add in edited:
    Object.entries(edited).forEach(([id, item]) => {
      // $FlowFixMe
      if (!updated[id]) {
        myPublishedCollections[id] = item;
      } else {
        // $FlowFixMe
        myPublishedCollections[id] = { ...myPublishedCollections[id], updatedAt: item.updatedAt };
      }
    });

    return myPublishedCollections;
  }
);

// returns published collections + local edits or update timestamps
export const selectMyPublicLocalCollections = createSelector(
  selectMyPublishedCollections,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  (myCollectionsById, edited, updated) => {
    if (!myCollectionsById) return myCollectionsById;

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

export const selectMyPublicCollectionForId = (state: State, id: string) => {
  const myCollectionClaimsById = selectMyPublishedCollections(state);
  return myCollectionClaimsById && myCollectionClaimsById[id];
};

export const selectIsMyCollectionPublishedForId = (state: State, id: string) =>
  Boolean(selectMyPublicCollectionForId(state, id));

export const selectPublishedCollectionNotEditedForId = createSelector(
  selectIsMyCollectionPublishedForId,
  selectCollectionHasEditsForId,
  (isPublished, hasEdits) => isPublished && !hasEdits
);

export const selectIsMyPublicCollectionNotEditedForId = (state: State, id: string) => {
  const publicCollection = selectMyPublicCollectionForId(state, id);
  if (!publicCollection) return publicCollection;

  const hasEdits = selectCollectionHasEditsForId(state, id);

  return Boolean(publicCollection && !hasEdits);
};

export const selectAreCollectionItemsFetchingForId = (state: State, id: string) =>
  new Set(selectCollectionItemsFetchingIds(state)).has(id);

export const selectCollectionsById = (state: State) => {
  const builtin = selectBuiltinCollections(state);
  const resolved = selectResolvedCollectionsById(state);
  const unpublished = selectMyUnpublishedCollections(state);
  const edited = selectMyEditedCollections(state);
  const queue = { queue: selectQueueCollection(state) };

  return { ...queue, ...resolved, ...edited, ...unpublished, ...builtin };
};

export const selectCollectionForId = createSelector(
  (state, id) => id,
  selectCollectionsById,
  selectResolvedCollectionsById,
  (id, collectionsById, resolved) => {
    if (!id) return id;

    const collection = collectionsById[id];

    const urlParams = new URLSearchParams(window.location.search);
    const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;

    if (isOnPublicView) return resolved[id] || collection;

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

export const selectClaimInCollectionsForUrl = (state: State, url: string) => {
  const queue = selectQueueCollection(state);
  const claimInQueue = queue.items.some((item) => item === url);
  const claimSaved = selectClaimSavedForUrl(state, url);

  return claimSaved && claimInQueue;
};

export const selectCollectionForIdHasClaimUrl = (state: State, id: string, uri: string) =>
  Boolean(selectCollectionForIdClaimForUriItem(state, id, uri));

export const selectItemsForCollectionId = (state: State, id: string) => {
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

export const selectFirstItemUrlForCollection = (state: State, id: string) => {
  const collectionItemUrls = selectUrlsForCollectionId(state, id, 1);
  if (!collectionItemUrls) return collectionItemUrls;

  return collectionItemUrls.length > 0 ? collectionItemUrls[0] : null;
};

export const selectCollectionLengthForId = (state: State, id: string) => {
  const urls = selectItemsForCollectionId(state, id);
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
  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(id);

  if (isBuiltin) {
    const userCreatedAt = selectUserCreationDate(state);
    return userCreatedAt;
  }

  if (collection?.createdAt) return collection.createdAt * 1000;

  return null;
};

export const selectCountForCollectionId = (state: State, id: string) =>
  getItemCountForCollection(selectCollectionForId(state, id));

// Has private === either is private or is public with private edits
export const selectHasPrivateCollectionForId = (state: State, id: string) => {
  const unpublishedCollection = selectUnpublishedCollectionForId(state, id);
  if (unpublishedCollection) return true;

  if (COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(id)) return true;

  if (selectCollectionHasEditsForId(state, id)) {
    const urlParams = new URLSearchParams(window.location.search);
    const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;
    if (!isOnPublicView) return true;
  }

  return false;
};

// Is private === only private (doesn't include public with private edits)
export const selectIsCollectionPrivateForId = (state: State, id: string) =>
  Boolean(selectHasPrivateCollectionForId(state, id) && !selectCollectionHasEditsForId(state, id));

export const selectClaimIdsForCollectionId = createSelector(
  selectHasPrivateCollectionForId,
  selectItemsForCollectionId,
  selectClaimIdsByUri,
  (isPrivate, items, byUri) => {
    if (!items || !isPrivate) return items;

    const ids = new Set([]);

    const notFetched = items.some((item) => {
      let claimId;
      try {
        claimId = byUri[normalizeURI(item)];
      } catch (e) {}

      if (claimId) {
        ids.add(claimId);
      } else {
        return true;
      }
    });

    if (notFetched) return undefined;

    return Array.from(ids);
  }
);

export const selectUrlsForCollectionId = createCachedSelector(
  (state, collectionId, itemCount) => itemCount,
  selectItemsForCollectionId,
  selectClaimsById,
  (itemCount, items, claimsById) => {
    if (!items) return items;

    const uris = new Set([]);

    let notFetched;

    items.some((item, index) => {
      if (isPermanentUrl(item) || isCanonicalUrl(item)) {
        uris.add(item);
      } else {
        const claim = claimsById[item];

        if (claim) {
          const uri = claim.permanent_url;
          uris.add(uri);
        } else if (claim === undefined) {
          notFetched = true;
        }
      }

      if (Number.isInteger(itemCount) ? index === itemCount - 1 : notFetched) {
        return true;
      }
    });

    if (notFetched && (!Number.isInteger(itemCount) || itemCount > uris.size)) {
      return undefined;
    }

    return Array.from(uris);
  }
)((state, url, itemCount) => `${String(url)}:${String(itemCount)}`);

export const selectCollectionForIdClaimForUriItem = createSelector(
  (state: State, id: string, uri: string) => uri,
  (state: State, id: string, uri: string) => selectClaimForUri(state, uri),
  selectUrlsForCollectionId,
  (uri, claim, collectionUrls) => {
    if (!collectionUrls) return collectionUrls;

    if (collectionUrls.includes(uri)) return uri;

    if (!claim) return false;

    const permanentUri = claim.permanent_url;

    if (collectionUrls.includes(permanentUri)) return permanentUri;

    const canonicalUri = claim.canonical_url;

    if (collectionUrls.includes(canonicalUri)) return canonicalUri;

    return false;
  }
);

export const selectThumbnailClaimUrisForCollectionId = createSelector(
  selectHasPrivateCollectionForId,
  selectItemsForCollectionId,
  selectClaimsById,
  (isPrivate, items, claimsById) => {
    if (!items || isPrivate) return items;

    const uris = new Set([]);

    let thumbnailUrisNotFetched;

    items.some((item, index) => {
      let uri;
      try {
        const claim = claimsById[item];
        uri = claim.permanent_url;
      } catch (e) {}

      if (uri) {
        uris.add(uri);
      } else {
        thumbnailUrisNotFetched = true;
      }

      if (index === 2) return true;
    });

    if (thumbnailUrisNotFetched) return undefined;

    return Array.from(uris);
  }
);

export const selectCollectionTypeForId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection?.type;
};

export const selectSourceIdForCollectionId = (state: State, id: string) => {
  const collection = selectCollectionForId(state, id);
  return collection && collection.sourceId;
};

export const selectCollectionKeyForId = (state: State, id: string) => {
  if (id === COLLECTIONS_CONSTS.QUEUE_ID) return COLLECTIONS_CONSTS.QUEUE_ID;
  if (selectUnpublishedCollectionForId(state, id)) return COLLECTIONS_CONSTS.KEYS.UNPUBLISHED;
  if (selectEditedCollectionForId(state, id)) return COLLECTIONS_CONSTS.KEYS.EDITED;
  if (COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(id)) return COLLECTIONS_CONSTS.KEYS.BUILTIN;
  if (selectUpdatedCollectionForId(state, id)) return COLLECTIONS_CONSTS.KEYS.UPDATED;

  return undefined;
};

export const selectFirstPlayingCollectionIndexForId = (state: State, collectionId: string) => {
  const collectionIsPlaying = selectIsCollectionPlayingForId(state, collectionId);
  if (!collectionIsPlaying) return collectionIsPlaying;

  const playingCollectionShuffleUrls = selectCollectionForIdIsPlayingShuffle(state, collectionId);
  const collectionUrls = selectUrlsForCollectionId(state, collectionId);

  const urls = playingCollectionShuffleUrls || collectionUrls;

  return urls && urls[0];
};

export const selectIndexForUrlInCollectionForId = createSelector(
  selectCollectionForIdClaimForUriItem,
  selectUrlsForCollectionId,
  (uriItem, collectionUrls) => {
    const index = collectionUrls && collectionUrls.findIndex((uri) => uri === uriItem);

    if (index > -1) return index;

    return null;
  }
);

export const selectIndexForUriInPlayingCollectionForId = createSelector(
  selectCollectionForIdClaimForUriItem,
  selectUrlsForCollectionId,
  selectCollectionForIdIsPlayingShuffle,
  (uriItem, collectionUrls, playingCollectionShuffleUrls) => {
    const uris = playingCollectionShuffleUrls || collectionUrls;

    const index = uris && uris.findIndex((uri) => uri === uriItem);

    if (index > -1) return index;

    return null;
  }
);

export const selectPreviousUriForUriInPlayingCollectionForId = createCachedSelector(
  selectUrlsForCollectionId,
  selectIndexForUriInPlayingCollectionForId,
  selectCollectionForIdIsPlayingShuffle,
  selectCollectionForIdIsPlayingLoop,
  (collectionUrls, currentIndex, playingCollectionShuffleUrls, isLooped) => {
    if (currentIndex === null) return null;

    const uris = playingCollectionShuffleUrls || collectionUrls;

    if (currentIndex === 0 && isLooped) {
      return uris[uris.length - 1];
    }

    return uris[currentIndex - 1];
  }
)((state, url, id) => `${String(url)}:${String(id)}`);

export const selectNextUriForUriInPlayingCollectionForId = createCachedSelector(
  selectUrlsForCollectionId,
  selectIndexForUriInPlayingCollectionForId,
  selectCollectionForIdIsPlayingShuffle,
  selectCollectionForIdIsPlayingLoop,
  (collectionUrls, currentIndex, playingCollectionShuffleUrls, isLooped) => {
    if (currentIndex === null) return null;

    const uris = playingCollectionShuffleUrls || collectionUrls;

    if (currentIndex === uris.length - 1 && isLooped) {
      return uris[0];
    }

    return uris[currentIndex + 1];
  }
)((state, url, id) => `${String(url)}:${String(id)}`);
