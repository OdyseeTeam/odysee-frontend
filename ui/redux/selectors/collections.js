// @flow
import fromEntries from '@ungap/from-entries';
import { createSelector } from 'reselect';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import moment from 'moment';
import {
  selectMyCollectionIds,
  selectClaimForUri,
  selectClaimForClaimId,
  selectChannelNameForId,
} from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import { selectUserCreationDate } from 'redux/selectors/user';
import { selectPlayingCollection } from 'redux/selectors/content';

type State = { collections: CollectionState };

const selectState = (state: State) => state.collections || {};

export const selectSavedCollectionIds = (state: State) => selectState(state).saved;
export const selectBuiltinCollections = (state: State) => selectState(state).builtin;
export const selectResolvedCollections = (state: State) => selectState(state).resolved;
export const selectMyUnpublishedCollections = (state: State) => selectState(state).unpublished;
export const selectMyEditedCollections = (state: State) => selectState(state).edited;
export const selectPendingCollections = (state: State) => selectState(state).pending;
export const selectIsResolvingCollectionById = (state: State) => selectState(state).isResolvingCollectionById;
export const selectQueueCollection = (state: State) => selectState(state).queue;

export const selectCurrentQueueList = createSelector(selectQueueCollection, (queue) => ({ queue }));
export const selectHasItemsInQueue = createSelector(selectQueueCollection, (queue) => queue.items.length > 0);

export const selectLastUsedCollection = createSelector(selectState, (state) => state.lastUsedCollection);

export const selectUnpublishedCollectionsList = createSelector(
  selectMyUnpublishedCollections,
  (unpublishedCollections) => Object.keys(unpublishedCollections || {})
);

export const selectHasCollections = createSelector(
  selectUnpublishedCollectionsList,
  selectMyCollectionIds,
  (unpublished, publishedIds) => Boolean(unpublished.length > 0 || publishedIds.length > 0)
);

export const selectEditedCollectionForId = createSelector(
  (state, id) => id,
  selectMyEditedCollections,
  (id, eLists) => eLists[id]
);

export const selectCollectionHasEditsForId = createSelector(
  (state, id) => id,
  selectMyEditedCollections,
  (id, eLists) => Boolean(eLists[id])
);

export const selectPendingCollectionForId = createSelector(
  (state, id) => id,
  selectPendingCollections,
  (id, pending) => pending[id]
);

export const selectPublishedCollectionForId = createSelector(
  (state, id) => id,
  selectResolvedCollections,
  (id, rLists) => rLists[id]
);

export const selectPublishedCollectionClaimForId = (state: any, id: string) => {
  const publishedCollection = selectPublishedCollectionForId(state, id);

  if (publishedCollection) {
    const claim = selectClaimForClaimId(state, id);
    return claim;
  }

  return null;
};

export const selectPublishedCollectionChannelNameForId = (state: any, id: string) => {
  const collectionClaim = selectPublishedCollectionClaimForId(state, id);

  if (collectionClaim) {
    const name = selectChannelNameForId(state, id);
    return name;
  }

  return null;
};

export const selectUnpublishedCollectionForId = createSelector(
  (state, id) => id,
  selectMyUnpublishedCollections,
  (id, rLists) => rLists[id]
);

export const selectCollectionIsMine = createSelector(
  (state, id) => id,
  selectMyCollectionIds,
  selectMyUnpublishedCollections,
  selectBuiltinCollections,
  selectCurrentQueueList,
  (id, publicIds, privateIds, builtinIds, queue) =>
    Boolean(publicIds.includes(id) || privateIds[id] || builtinIds[id] || queue[id])
);

export const selectMyPublishedCollections = createSelector(
  selectResolvedCollections,
  selectPendingCollections,
  selectMyEditedCollections,
  selectMyCollectionIds,
  (resolved, pending, edited, myIds) => {
    // all resolved in myIds, plus those in pending and edited
    const myPublishedCollections = fromEntries(
      Object.entries(pending).concat(
        Object.entries(resolved).filter(
          ([key, val]) =>
            myIds.includes(key) &&
            // $FlowFixMe
            !pending[key]
        )
      )
    );
    // now add in edited:
    Object.entries(edited).forEach(([id, item]) => {
      myPublishedCollections[id] = item;
    });
    return myPublishedCollections;
  }
);

export const selectCollectionValuesListForKey = createSelector(
  (state, key) => key,
  selectBuiltinCollections,
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  (key, builtin, published, unpublished) => {
    const myCollections = { builtin, published, unpublished };
    const collectionsForKey = myCollections[key];
    // this is needed so Flow doesn't error saying it is mixed when this list is looped
    const collectionValues: CollectionList = (Object.values(collectionsForKey): any);

    return collectionValues;
  }
);

export const selectIsMyCollectioPublishedForId = createSelector(
  (state, id) => id,
  selectMyPublishedCollections,
  (id, myPublished) => Boolean(myPublished[id])
);

export const selectPublishedCollectionNotEditedForId = createSelector(
  selectIsMyCollectioPublishedForId,
  selectCollectionHasEditsForId,
  (isPublished, hasEdits) => isPublished && !hasEdits
);

export const selectMyPublishedMixedCollections = createSelector(selectMyPublishedCollections, (published) => {
  const myCollections = fromEntries(
    // $FlowFixMe
    Object.entries(published).filter(([key, collection]) => {
      // $FlowFixMe
      return collection.type === 'collection';
    })
  );
  return myCollections;
});

export const selectMyPublishedPlaylistCollections = createSelector(selectMyPublishedCollections, (published) => {
  const myCollections = fromEntries(
    // $FlowFixMe
    Object.entries(published).filter(([key, collection]) => {
      // $FlowFixMe
      return collection.type === 'playlist';
    })
  );
  return myCollections;
});

export const selectMyPublishedCollectionForId = createSelector(
  (state, id) => id,
  selectMyPublishedCollections,
  (id, myPublishedCollections) => myPublishedCollections[id]
);

export const selectIsResolvingCollectionForId = createSelector(
  (state, id) => id,
  selectIsResolvingCollectionById,
  (id, resolvingById) => resolvingById[id]
);

export const selectCollectionForId = createSelector(
  (state, id) => id,
  selectBuiltinCollections,
  selectResolvedCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectPendingCollections,
  selectCurrentQueueList,
  (id, bLists, rLists, uLists, eLists, pLists, queue) => {
    const collection = bLists[id] || uLists[id] || eLists[id] || pLists[id] || rLists[id] || queue[id];
    return collection;
  }
);

export const selectIsCollectionBuiltInForId = createSelector(
  (state, id) => id,
  selectBuiltinCollections,
  (id, builtin) => Boolean(builtin[id])
);

export const selectClaimInCollectionsForUrl = createSelector(
  (state, url) => url,
  selectBuiltinCollections,
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectPendingCollections,
  selectCurrentQueueList,
  (url, bLists, myRLists, uLists, eLists, pLists, queue) => {
    const collections = [bLists, uLists, eLists, myRLists, pLists, queue];

    // $FlowFixMe
    return collections.some((list) => Object.values(list).some(({ items }) => items.some((item) => item === url)));
  }
);

export const selectCollectionForIdHasClaimUrl = createSelector(
  (state, id, url) => url,
  selectCollectionForId,
  (url, collection) => collection && collection.items.includes(url)
);

export const selectUrlsForCollectionId = createSelector(
  (state, id) => id,
  selectCollectionForId,
  (id, collection) => collection && collection.items
);

export const selectFirstItemUrlForCollection = createSelector(
  selectUrlsForCollectionId,
  (collectionItemUrls) => collectionItemUrls?.length > 0 && collectionItemUrls[0]
);

export const selectCollectionLengthForId = createSelector(selectUrlsForCollectionId, (urls) => urls?.length || 0);

export const selectAreBuiltinCollectionsEmpty = (state: State) => {
  let length = 0;

  COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.forEach((collectionKey) => {
    if (collectionKey !== COLLECTIONS_CONSTS.QUEUE_ID) {
      length += selectCollectionLengthForId(state, collectionKey);
    }
  });

  return length === 0;
};

export const selectClaimIdsForCollectionId = createSelector(selectCollectionForId, (collection) => {
  const items = (collection && collection.items) || [];

  const ids = items.map((item) => {
    const { claimId } = parseURI(item);
    return claimId;
  });

  return ids;
});

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

export const selectPreviousUrlForCollectionAndUrl = createSelector(
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
);

export const selectNextUrlForCollectionAndUrl = createSelector(
  (state, url, id) => id,
  (state) => selectPlayingCollection,
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
);

export const selectNameForCollectionId = createSelector(
  selectCollectionForId,
  (collection) => (collection && collection.name) || ''
);

export const selectUpdatedAtForCollectionId = createSelector(
  selectCollectionForId,
  selectUserCreationDate,
  (collection, userCreatedAt) => {
    const collectionUpdatedAt = collection.updatedAt;
    const userCreationDate = moment(new Date(userCreatedAt)).format('MMMM DD YYYY');
    const collectionUpdatedDate = moment(new Date(collectionUpdatedAt)).format('MMMM DD YYYY');

    // Collection updated time can't be older than account creation date
    if (moment(collectionUpdatedDate).diff(moment(userCreationDate)) < 0) {
      return userCreatedAt;
    }

    return collectionUpdatedAt || '';
  }
);

export const selectCountForCollectionId = createSelector(selectCollectionForId, (collection) => {
  if (collection) {
    if (collection.itemCount !== undefined) {
      return collection.itemCount;
    }
    let itemCount = 0;
    collection.items.map((item) => {
      if (item) {
        itemCount += 1;
      }
    });
    return itemCount;
  }
  return null;
});

export const selectIsCollectionPrivateForId = createSelector(
  (state, id) => id,
  selectBuiltinCollections,
  selectMyUnpublishedCollections,
  selectCurrentQueueList,
  (id, builtinById, unpublishedById, queue) => builtinById[id] || unpublishedById[id] || queue[id]
);
