// @flow
import { handleActions } from 'util/redux-utils';
import { getCurrentTimeInSec } from 'util/time';
import { defaultCollectionState } from 'util/collections';
import * as ACTIONS from 'constants/action_types';
import * as COLS from 'constants/collections';

const defaultState: CollectionState = {
  // -- sync --
  builtin: {
    watchlater: {
      ...defaultCollectionState,
      id: COLS.WATCH_LATER_ID,
      name: COLS.WATCH_LATER_NAME,
      type: COLS.COL_TYPES.PLAYLIST,
    },
    favorites: {
      ...defaultCollectionState,
      id: COLS.FAVORITES_ID,
      name: COLS.FAVORITES_NAME,
      type: COLS.COL_TYPES.PLAYLIST,
    },
  },
  unpublished: {},
  edited: {},
  updated: {},
  unsavedChanges: {},
  savedIds: [],
  // -- local --
  isFetchingMyCollections: undefined,
  lastUsedCollection: undefined,
  collectionItemsFetchingIds: [],
  queue: {
    ...defaultCollectionState,
    id: COLS.QUEUE_ID,
    name: COLS.QUEUE_NAME,
    type: COLS.COL_TYPES.PLAYLIST,
  },
  resolvedIds: undefined,
  thumbnailClaimsFetchingCollectionIds: [],
};

const collectionsReducer = handleActions(
  {
    [ACTIONS.COLLECTION_LIST_MINE_STARTED]: (state) => ({ ...state, isFetchingMyCollections: true }),
    [ACTIONS.COLLECTION_LIST_MINE_COMPLETE]: (state) => ({ ...state, isFetchingMyCollections: false }),

    [ACTIONS.COLLECTION_NEW]: (state, action) => {
      const { entry: params } = action.data; // { id:, items: Array<string>}
      const currentTime = getCurrentTimeInSec();

      // entry
      const newListTemplate: Collection = {
        id: params.id,
        name: params.name,
        items: [],
        itemCount: params.items.length,
        createdAt: currentTime,
        updatedAt: currentTime,
        type: params.type,
      };

      const newList = Object.assign({}, newListTemplate, { ...params });
      const { unpublished: lists } = state;
      const newLists = Object.assign({}, lists, { [params.id]: newList });

      return {
        ...state,
        unpublished: newLists,
        lastUsedCollection: params.id,
      };
    },

    [ACTIONS.COLLECTION_TOGGLE_SAVE]: (state, action) => {
      const collectionId = action.data;
      const newSavedIds = new Set(state.savedIds);

      if (newSavedIds.has(collectionId)) {
        newSavedIds.delete(collectionId);
      } else {
        newSavedIds.add(collectionId);
      }

      return { ...state, savedIds: Array.from(newSavedIds) };
    },

    [ACTIONS.DELETE_ID_FROM_LOCAL_COLLECTIONS]: (state, action) => {
      const collectionId = action.data;

      const newEditList = Object.assign({}, state.edited);
      const newUnpublishedList = Object.assign({}, state.unpublished);
      const newUpdatedList = Object.assign({}, state.updated);
      const newUnsavedChangesList = Object.assign({}, state.unsavedChanges);
      if (newEditList[collectionId]) delete newEditList[collectionId];
      if (newUnpublishedList[collectionId]) delete newUnpublishedList[collectionId];
      if (newUpdatedList[collectionId]) delete newUpdatedList[collectionId];
      if (newUnsavedChangesList[collectionId]) delete newUnsavedChangesList[collectionId];

      return {
        ...state,
        edited: newEditList,
        unpublished: newUnpublishedList,
        updated: newUpdatedList,
        unsavedChanges: newUnsavedChangesList,
      };
    },
    [ACTIONS.COLLECTION_DELETE]: (state, action) => {
      const { id, collectionKey } = action.data;

      const collectionsByIdForKey = Object.assign({}, state[collectionKey]);
      if (collectionsByIdForKey[id]) delete collectionsByIdForKey[id];

      return {
        ...state,
        [collectionKey]: collectionsByIdForKey,
        lastUsedCollection:
          state.lastUsedCollection === id && collectionKey !== COLS.KEYS.UNSAVED_CHANGES
            ? null
            : state.lastUsedCollection,
      };
    },

    [ACTIONS.QUEUE_EDIT]: (state, action) => {
      const { collection } = action.data;

      const newQueue = Object.assign({}, state.queue, collection, { updatedAt: getCurrentTimeInSec() });

      return { ...state, queue: newQueue };
    },
    [ACTIONS.QUEUE_CLEAR]: (state) => {
      const newQueue = Object.assign({}, state.queue, { items: [], updatedAt: getCurrentTimeInSec() });

      return { ...state, queue: newQueue };
    },

    [ACTIONS.COLLECTION_EDIT]: (state, action) => {
      const { collectionKey, collection } = action.data;
      const id = collection.id;

      const { [collectionKey]: currentCollections } = state;

      const newCollection = Object.assign({}, collection);
      newCollection.updatedAt = getCurrentTimeInSec();

      const newState = {
        ...state,
        [collectionKey]: { ...currentCollections, [id]: newCollection },
        lastUsedCollection: id,
      };

      // Remove un-wanted versions of the list
      [COLS.KEYS.UPDATED, COLS.KEYS.UNSAVED_CHANGES].forEach((key) => {
        if (collectionKey !== key) {
          const { [id]: _, ...remainingCollections } = state[key];
          newState[key] = remainingCollections;
        }
      });

      return newState;
    },

    [ACTIONS.USER_STATE_POPULATE]: (state, action) => {
      const { builtinCollections, savedCollectionIds, unpublishedCollections, editedCollections, updatedCollections } =
        action.data;

      return {
        ...state,
        edited: editedCollections || state.edited,
        updated: updatedCollections || state.updated,
        unpublished: unpublishedCollections || state.unpublished,
        builtin: builtinCollections || state.builtin,
        savedIds: savedCollectionIds || state.savedIds,
      };
    },

    [ACTIONS.COLLECTION_ITEMS_RESOLVE_START]: (state, action) => {
      const collectionId = action.data;

      const newCollectionItemsFetchingIds = new Set(state.collectionItemsFetchingIds);
      newCollectionItemsFetchingIds.add(collectionId);

      return { ...state, collectionItemsFetchingIds: Array.from(newCollectionItemsFetchingIds) };
    },
    [ACTIONS.COLLECTION_ITEMS_RESOLVE_SUCCESS]: (state, action) => {
      const { resolvedCollection } = action.data;

      const { id, key, items, updatedAt } = resolvedCollection;

      const newEdited = Object.assign({}, state.edited);
      const newUnpublished = Object.assign({}, state.unpublished);
      const newUpdated = Object.assign({}, state.updated);
      const newCollectionItemsFetchingIds = new Set(state.collectionItemsFetchingIds);
      const newResolvedIds = new Set(state.resolvedIds);

      if (key === COLS.KEYS.EDITED) {
        if (newEdited[id]) Object.assign(newEdited[id].items, items);
      } else if (key === COLS.KEYS.UNPUBLISHED) {
        if (newUnpublished[id]) Object.assign(newUnpublished[id].items, items);
      } else if (key === COLS.KEYS.UPDATED) {
        if (newUpdated[id]) {
          if (newUpdated[id]['updatedAt'] < updatedAt) {
            delete newUpdated[id];
          }
        }
      }

      newCollectionItemsFetchingIds.delete(id);
      newResolvedIds.add(id);

      return {
        ...state,
        edited: newEdited,
        unpublished: newUnpublished,
        updated: newUpdated,
        collectionItemsFetchingIds: Array.from(newCollectionItemsFetchingIds),
        resolvedIds: Array.from(newResolvedIds),
      };
    },
    [ACTIONS.COLLECTION_ITEMS_RESOLVE_FAIL]: (state, action) => {
      const collectionId = action.data;

      const newCollectionItemsFetchingIds = new Set(state.collectionItemsFetchingIds);
      if (newCollectionItemsFetchingIds.has(collectionId)) {
        newCollectionItemsFetchingIds.delete(collectionId);
      }

      return { ...state, collectionItemsFetchingIds: Array.from(newCollectionItemsFetchingIds) };
    },

    [ACTIONS.COLLECTION_THUMBNAIL_CLAIMS_RESOLVE_START]: (state, action) => {
      const collectionIds = action.data;

      const newThumbnailClaimsFetchingCollectionIds = new Set(state.thumbnailClaimsFetchingCollectionIds);
      newThumbnailClaimsFetchingCollectionIds.add(collectionIds);

      return { ...state, thumbnailClaimsFetchingCollectionIds: Array.from(newThumbnailClaimsFetchingCollectionIds) };
    },
    [ACTIONS.COLLECTION_THUMBNAIL_CLAIMS_RESOLVE_COMPLETE]: (state, action) => {
      const collectionIds = action.data;

      const newThumbnailClaimsFetchingCollectionIds = new Set(state.thumbnailClaimsFetchingCollectionIds);
      newThumbnailClaimsFetchingCollectionIds.delete(collectionIds);

      return { ...state, thumbnailClaimsFetchingCollectionIds: Array.from(newThumbnailClaimsFetchingCollectionIds) };
    },
  },
  defaultState
);

export { collectionsReducer };
