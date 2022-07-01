// @flow
import * as ACTIONS from 'constants/action_types';
import { v4 as uuid } from 'uuid';
import Lbry from 'lbry';
import { doClaimSearch, doAbandonClaim, doGetClaimFromUriResolve } from 'redux/actions/claims';
import { makeSelectClaimForClaimId, selectPermanentUrlForUri } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  // selectPublishedCollectionForId, // for "save" or "copy" action
  selectPublishedCollectionForId,
  selectUnpublishedCollectionForId,
  selectEditedCollectionForId,
  selectHasItemsInQueue,
} from 'redux/selectors/collections';
import * as COLS from 'constants/collections';
import { getCurrentTimeInMs } from 'util/time';
import { isPermanentUrl } from 'util/claim';

const FETCH_BATCH_SIZE = 50;

export const doLocalCollectionCreate = (params: CollectionCreateParams, cb?: (id: any) => void) => (
  dispatch: Dispatch
) => {
  const { items } = params;
  const id = uuid();

  if (cb) cb(id);

  const currentTimeInMs = getCurrentTimeInMs();

  return dispatch({
    type: ACTIONS.COLLECTION_NEW,
    data: {
      entry: {
        id: id, // start with a uuid, this becomes a claimId after publish
        createdAt: currentTimeInMs,
        updatedAt: currentTimeInMs,
        items: items || [],
        ...params,
      },
    },
  });
};

export const doCollectionDelete = (id: string, colKey: ?string = undefined) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState();
  const claim = makeSelectClaimForClaimId(id)(state);
  const collectionDelete = () =>
    dispatch({
      type: ACTIONS.COLLECTION_DELETE,
      data: {
        id: id,
        collectionKey: colKey,
      },
    });
  if (claim && !colKey) {
    // could support "abandon collection claim, but keep private collection" later
    return dispatch(doAbandonClaim(claim, collectionDelete));
  }
  return collectionDelete();
};

// Given a collection, save its collectionId to be resolved and displayed in Library
// export const doCollectionSave = (
//   id: string,
// ) => (dispatch: Dispatch) => {
//   return dispatch({
//     type: ACTIONS.COLLECTION_SAVE,
//     data: {
//       id: id,
//     },
//   });
// };

// Given a collection and name, copy it to a local private collection with a name
// export const doCollectionCopy = (
//   id: string,
// ) => (dispatch: Dispatch) => {
//   return dispatch({
//     type: ACTIONS.COLLECTION_COPY,
//     data: {
//       id: id,
//     },
//   });
// };

export const doFetchItemsInCollections = (
  resolveItemsOptions: {
    collectionIds: Array<string>,
    pageSize?: number,
  },
  resolveStartedCallback?: () => void
) => async (dispatch: Dispatch, getState: GetState) => {
  /*
  1) make sure all the collection claims are loaded into claims reducer, search/resolve if necessary.
  2) get the item claims for each
  3) format and make sure they're in the order as in the claim
  4) Build the collection objects and update collections reducer
  5) Update redux claims reducer
   */
  let state = getState();
  const { collectionIds, pageSize } = resolveItemsOptions;

  dispatch({
    type: ACTIONS.COLLECTION_ITEMS_RESOLVE_STARTED,
    data: { ids: collectionIds },
  });

  if (resolveStartedCallback) resolveStartedCallback();

  const collectionIdsToSearch = collectionIds.filter((claimId) => !state.claims.byId[claimId]);

  if (collectionIdsToSearch.length) {
    await dispatch(doClaimSearch({ claim_ids: collectionIdsToSearch, page: 1, page_size: 9999 }));
  }

  const stateAfterClaimSearch = getState();

  async function fetchItemsForCollectionClaim(claim: CollectionClaim, pageSize?: number) {
    const totalItems = claim.value.claims && claim.value.claims.length;
    const claimId = claim.claim_id;
    const itemOrder = claim.value.claims;

    const sortResults = (items: Array<Claim>, claimList) => {
      const newItems: Array<Claim> = [];
      claimList.forEach((id) => {
        const index = items.findIndex((i) => i.claim_id === id);
        if (index >= 0) {
          newItems.push(items[index]);
        }
      });
      /*
        This will return newItems[] of length less than total_items below
        if one or more of the claims has been abandoned. That's ok for now.
      */
      return newItems;
    };

    const mergeBatches = (
      arrayOfResults: Array<{ items: Array<Claim>, total_items: number }>,
      claimList: Array<string>
    ) => {
      const mergedResults: { items: Array<Claim>, total_items: number } = {
        items: [],
        total_items: 0,
      };
      arrayOfResults.forEach((result) => {
        mergedResults.items = mergedResults.items.concat(result.items);
        mergedResults.total_items = result.total_items;
      });

      mergedResults.items = sortResults(mergedResults.items, claimList);
      return mergedResults;
    };

    try {
      const batchSize = pageSize || FETCH_BATCH_SIZE;
      const batches: Array<Promise<any>> = [];

      for (let i = 0; i < Math.ceil(totalItems / batchSize); i++) {
        batches[i] = Lbry.claim_search({
          claim_ids: claim.value.claims.slice(i * batchSize, (i + 1) * batchSize),
          page: 1,
          page_size: batchSize,
          no_totals: true,
        });
      }
      const itemsInBatches = await Promise.all(batches);
      const result = mergeBatches(itemsInBatches, itemOrder);

      // $FlowFixMe
      const itemsById: { claimId: string, items?: ?Array<GenericClaim> } = { claimId: claimId };
      if (result.items) {
        itemsById.items = result.items;
      } else {
        itemsById.items = null;
      }
      return itemsById;
    } catch (e) {
      return {
        claimId: claimId,
        items: null,
      };
    }
  }

  const invalidCollectionIds = [];
  const promisedCollectionItemFetches = [];
  collectionIds.forEach((collectionId) => {
    const claim = makeSelectClaimForClaimId(collectionId)(stateAfterClaimSearch);
    if (!claim) {
      invalidCollectionIds.push(collectionId);
    } else {
      promisedCollectionItemFetches.push(fetchItemsForCollectionClaim(claim, pageSize));
    }
  });

  // $FlowFixMe
  const collectionItemsById: Array<{
    claimId: string,
    items: ?Array<GenericClaim>,
  }> = await Promise.all(promisedCollectionItemFetches);

  const newCollectionObjectsById = {};
  const resolvedItemsByUrl = {};
  collectionItemsById.forEach((entry) => {
    // $FlowFixMe
    const collectionItems: Array<any> = entry.items;
    const collectionId = entry.claimId;
    if (collectionItems) {
      const claim = makeSelectClaimForClaimId(collectionId)(stateAfterClaimSearch);

      const editedCollection = selectEditedCollectionForId(stateAfterClaimSearch, collectionId);
      const { name, timestamp, value } = claim || {};
      const { title } = value;
      const valueTypes = new Set();
      const streamTypes = new Set();

      let newItems = [];
      let isPlaylist;

      if (collectionItems) {
        collectionItems.forEach((collectionItem) => {
          newItems.push(collectionItem.permanent_url);
          valueTypes.add(collectionItem.value_type);
          if (collectionItem.value.stream_type) {
            streamTypes.add(collectionItem.value.stream_type);
          }
          resolvedItemsByUrl[collectionItem.canonical_url] = collectionItem;
        });
        isPlaylist =
          valueTypes.size === 1 &&
          valueTypes.has('stream') &&
          ((streamTypes.size === 1 && (streamTypes.has('audio') || streamTypes.has('video'))) ||
            (streamTypes.size === 2 && streamTypes.has('audio') && streamTypes.has('video')));
      }

      newCollectionObjectsById[collectionId] = {
        items: newItems,
        id: collectionId,
        name: title || name,
        itemCount: claim.value.claims.length,
        type: isPlaylist ? 'playlist' : 'collection',
        updatedAt: timestamp,
      };

      if (editedCollection && timestamp > editedCollection['updatedAt']) {
        dispatch({
          type: ACTIONS.COLLECTION_DELETE,
          data: {
            id: collectionId,
            collectionKey: 'edited',
          },
        });
      }
    } else {
      invalidCollectionIds.push(collectionId);
    }
  });

  const resolveInfo: ClaimActionResolveInfo = {};

  const resolveReposts = true;

  collectionItemsById.forEach((collection) => {
    // GenericClaim type probably needs to be updated to avoid this "Any"
    collection.items &&
      collection.items.forEach((result: any) => {
        result = { [result.canonical_url]: result };
        processResult(result, resolveInfo, resolveReposts);
      });
  });

  dispatch({
    type: ACTIONS.RESOLVE_URIS_COMPLETED,
    data: { resolveInfo },
  });

  dispatch({
    type: ACTIONS.COLLECTION_ITEMS_RESOLVE_COMPLETED,
    data: {
      resolvedCollections: newCollectionObjectsById,
      failedCollectionIds: invalidCollectionIds,
    },
  });
};

function processResult(result, resolveInfo = {}, checkReposts = false) {
  const fallbackResolveInfo = {
    stream: null,
    claimsInChannel: null,
    channel: null,
  };

  Object.entries(result).forEach(([uri, uriResolveInfo]) => {
    // Flow has terrible Object.entries support
    // https://github.com/facebook/flow/issues/2221
    if (uriResolveInfo) {
      if (uriResolveInfo.error) {
        // $FlowFixMe
        resolveInfo[uri] = { ...fallbackResolveInfo };
      } else {
        let result = {};
        if (uriResolveInfo.value_type === 'channel') {
          result.channel = uriResolveInfo;
          // $FlowFixMe
          result.claimsInChannel = uriResolveInfo.meta.claims_in_channel;
        } else if (uriResolveInfo.value_type === 'collection') {
          result.collection = uriResolveInfo;
          // $FlowFixMe
        } else {
          result.stream = uriResolveInfo;
          if (uriResolveInfo.signing_channel) {
            result.channel = uriResolveInfo.signing_channel;
            result.claimsInChannel =
              (uriResolveInfo.signing_channel.meta && uriResolveInfo.signing_channel.meta.claims_in_channel) || 0;
          }
        }
        // $FlowFixMe
        resolveInfo[uri] = result;
      }
    }
  });
}

export const doFetchItemsInCollection = (options: { collectionId: string, pageSize?: number }, cb?: () => void) => {
  const { collectionId, pageSize } = options;
  const newOptions: { collectionIds: Array<string>, pageSize?: number } = {
    collectionIds: [collectionId],
  };
  if (pageSize) newOptions.pageSize = pageSize;
  return doFetchItemsInCollections(newOptions, cb);
};

export const doCollectionEdit = (collectionId: string, params: CollectionEditParams) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState();
  const collection: Collection = selectCollectionForId(state, collectionId);

  if (!collection) {
    return dispatch({
      type: ACTIONS.COLLECTION_ERROR,
      data: { message: 'collection does not exist' },
    });
  }

  const editedCollection: Collection = selectEditedCollectionForId(state, collectionId);
  const unpublishedCollection: Collection = selectUnpublishedCollectionForId(state, collectionId);
  const publishedCollection: Collection = selectPublishedCollectionForId(state, collectionId); // needs to be published only

  const { uris: anyUris, remove, order, type } = params;

  // -- sanitization --
  // only permanent urls can be added to collections
  const uris = [];

  if (anyUris) {
    anyUris.forEach(async (uri) => {
      if (isPermanentUrl(uri)) return uris.push(uri);

      let url = selectPermanentUrlForUri(state, uri);

      if (!url) {
        const claim = await dispatch(doGetClaimFromUriResolve(url));
        if (claim) url = claim.permanent_url;
      }

      return uris.push(url);
    });
  }

  // -------------------

  const collectionType = type || collection.type;
  const currentUrls = collection.items ? collection.items.concat() : [];
  let newItems = currentUrls;

  // Passed uris to add/remove:
  if (uris) {
    if (remove) {
      // Filters (removes) the passed uris from the current list items
      newItems = currentUrls.filter((url) => url && !uris.includes(url));
    } else {
      // Pushes (adds to the end) the passed uris to the current list items
      // (only if item not already in currentUrls, avoid duplicates)
      uris.forEach((url) => !currentUrls.includes(url) && newItems.push(url));
    }
  } else if (remove) {
    // no uris and remove === true: clear the list
    newItems = [];
  }

  // Passed an ordering to change: (doesn't need the uris here since
  // the items are already on the list)
  if (order) {
    const [movedItem] = currentUrls.splice(order.from, 1);
    currentUrls.splice(order.to, 0, movedItem);
  }

  // Delete 'edited' if newItems are the same as publishedItems
  if (editedCollection && newItems && publishedCollection.items.join(',') === newItems.join(',')) {
    return dispatch({
      type: ACTIONS.COLLECTION_DELETE,
      data: { id: collectionId, collectionKey: 'edited' },
    });
  }

  const collectionKey =
    (collectionId === COLS.QUEUE_ID && COLS.QUEUE_ID) ||
    ((editedCollection || publishedCollection) && COLS.COL_KEY_EDITED) ||
    (COLS.BUILTIN_PLAYLISTS.includes(collectionId) && COLS.COL_KEY_BUILTIN) ||
    (unpublishedCollection && COLS.COL_KEY_UNPUBLISHED);

  return dispatch({
    type: ACTIONS.COLLECTION_EDIT,
    data: {
      collectionKey,
      collection: {
        items: newItems,
        id: collectionId,
        name: params.name || collection.name,
        type: collectionType,
      },
    },
  });
};

export const doClearQueueList = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const hasItemsInQueue = selectHasItemsInQueue(state);

  if (hasItemsInQueue) {
    return dispatch(doCollectionEdit(COLS.QUEUE_ID, { remove: true, type: 'playlist' }));
  }
};
