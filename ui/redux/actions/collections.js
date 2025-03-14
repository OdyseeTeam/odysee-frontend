// @flow
import * as ACTIONS from 'constants/action_types';
import { batchActions } from 'util/batch-actions';
import { v4 as uuid } from 'uuid';
import Lbry from 'lbry';
import {
  doAbandonClaim,
  doResolveUris,
  doResolveClaimId,
  doResolveClaimIds,
  doCheckPendingClaims,
} from 'redux/actions/claims';
import {
  selectClaimForClaimId,
  selectClaimForId,
  makeSelectMetadataItemForUri,
  selectHasClaimForId,
  selectResolvingIds,
  selectResolvingUris,
  selectFailedToResolveUris,
  selectFailedToResolveIds,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectResolvedCollectionForId,
  selectCollectionHasItemsResolvedForId,
  selectHasPrivateCollectionForId,
  selectIsCollectionPrivateForId,
  selectUrlsForCollectionId,
  selectCollectionSavedForId,
  selectAreCollectionItemsFetchingForId,
  selectCollectionKeyForId,
  selectCollectionForIdClaimForUriItem,
  selectAreThumbnailClaimsFetchingForCollectionIds,
} from 'redux/selectors/collections';
import * as COLS from 'constants/collections';
import { resolveAuxParams, resolveCollectionType, getClaimIdsInCollectionClaim } from 'util/collections';
import { getThumbnailFromClaim } from 'util/claim';
import { creditsToString } from 'util/format-credits';
import { doToast } from 'redux/actions/notifications';

const FETCH_BATCH_SIZE = 50;

export const doFetchCollectionListMine =
  (options: CollectionListOptions = { resolve: true, page: 1, page_size: 50 }) =>
  async (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.COLLECTION_LIST_MINE_STARTED });

    const failure = (error) => dispatch({ type: ACTIONS.COLLECTION_LIST_MINE_COMPLETE });

    const autoPaginate = () => {
      const fullResponseObj: CollectionListResponse = {
        items: [],
        page: 0,
        page_size: options.page_size,
        total_pages: 0,
        total_items: 0,
      };

      const next = async (response: CollectionListResponse) => {
        const { items, ...rest } = response;
        const moreData = response.items.length === options.page_size;

        fullResponseObj.items = fullResponseObj.items.concat(items);
        Object.assign(fullResponseObj, rest);

        options.page++;

        if (!moreData) {
          // -- Add collection claims to myClaims
          return dispatch(
            batchActions(
              { type: ACTIONS.FETCH_CLAIM_LIST_MINE_COMPLETED, data: { result: fullResponseObj } },
              { type: ACTIONS.COLLECTION_LIST_MINE_COMPLETE }
            )
          );
        }

        try {
          const data = await Lbry.collection_list(options);
          return next(data);
        } catch (err) {
          failure(err);
        }
      };

      return next;
    };

    return await Lbry.collection_list(options).then(autoPaginate(), failure);
  };

export function doCollectionPublish(options: CollectionPublishCreateParams, collectionId: string, cb?: () => void) {
  return (dispatch: Dispatch, getState: GetState): Promise<any> => {
    const state = getState();
    const isPrivate = selectIsCollectionPrivateForId(state, collectionId);
    const collection = selectCollectionForId(state, collectionId);
    const createdAtTimestamp = collection.createdAt;

    // $FlowFixMe
    const params: GenericPublishCreateParams = {
      channel_id: options.channel_id,
      bid: creditsToString(options.bid),
      blocking: true,
      title: options.title,
      thumbnail_url: options.thumbnail_url,
      // $FlowFixMe
      tags: options.tags ? options.tags.map((tag) => tag.name) : [],
      languages: options.languages || [],
      description: options.description,
    };
    const fullParams = {};

    if (isPrivate) {
      const publishParams: CollectionPublishCreateParams = {
        ...params,
        name: options.name,
        // -- avoid duplicates --
        claims: Array.from(new Set(options.claims)),
      };

      Object.assign(fullParams, publishParams);
    } else {
      const updateParams: CollectionPublishUpdateParams = {
        ...params,
        claim_id: collectionId,
        clear_claims: true,
        replace: true,
        // -- avoid duplicates --
        claims: Array.from(new Set(options.claims)),
      };

      Object.assign(fullParams, updateParams);
    }

    if (fullParams.description && typeof fullParams.description !== 'string') {
      delete fullParams.description;
    }

    return new Promise((resolve, reject) => {
      const publishFn = isPrivate ? Lbry.collection_create : Lbry.collection_update;

      function success(response: CollectionCreateResponse) {
        const collectionClaim = response.outputs[0];
        if (!collectionClaim?.meta.creation_timestamp) collectionClaim.meta.creation_timestamp = createdAtTimestamp;
        if (!collectionClaim?.timestamp) collectionClaim.timestamp = Date.now();

        dispatch({ type: ACTIONS.DELETE_ID_FROM_LOCAL_COLLECTIONS, data: collectionId });

        dispatch(
          batchActions(
            { type: ACTIONS.UPDATE_PENDING_CLAIMS, data: { claims: [collectionClaim] } },
            doCheckPendingClaims()
          )
        );

        return resolve(collectionClaim);
      }

      function failure(error) {
        if (cb) cb();

        const scriptSizeError = error.message.match(/script size ([0-9]+) exceeds limit 8192/);
        let customMessage = null;
        if (scriptSizeError) {
          const maxSize = 8192;
          const itemSizeInTx = 24;
          const extraBytes = parseInt(scriptSizeError.at(1).toString()) - maxSize;
          const itemsToDelete = Math.ceil(extraBytes / itemSizeInTx);

          customMessage = __('Playlist exceeds size limits.') +
          ' ' +
          (itemsToDelete > 1
            ? __('Please remove %itemsToDelete% items', {itemsToDelete})
            : __('Please remove 1 item')) +
          ' ' +
          (extraBytes > 1
            ? __('or %extraBytes% characters of text.', {extraBytes})
            : __('or 1 character of text.'));
        }
        dispatch(doToast({ message: customMessage || error.message, isError: true }));
        reject(error);
        throw new Error(error);
      }

      // $FlowFixMe
      return publishFn(fullParams).then(success, failure);
    });
  };
}

export const doLocalCollectionCreate =
  (params: CollectionLocalCreateParams, cb?: (id: any) => void) => (dispatch: Dispatch, getState: GetState) => {
    const { items, sourceId } = params;

    const id = uuid(); // start with a uuid, this becomes a claimId after publish
    if (cb) cb(id);

    if (sourceId) {
      const state = getState();
      const sourceCollectionItems = selectUrlsForCollectionId(state, sourceId);
      const sourceCollection = selectCollectionForId(state, sourceId);
      const sourceCollectionClaim = selectClaimForId(state, sourceId);
      const sourceDescription =
        sourceCollection.description ||
        makeSelectMetadataItemForUri(sourceCollectionClaim?.canonical_url, 'description')(state);
      const thumbnailUrl = sourceCollection.thumbnail?.url || getThumbnailFromClaim(sourceCollectionClaim);

      return dispatch({
        type: ACTIONS.COLLECTION_NEW,
        data: {
          entry: {
            ...params,
            id: id,
            items: sourceCollectionItems,
            itemCount: sourceCollectionItems.length,
            description: sourceDescription,
            ...(thumbnailUrl && { thumbnail: { url: thumbnailUrl } }),
          },
        },
      });
    }

    return dispatch({
      type: ACTIONS.COLLECTION_NEW,
      data: {
        entry: {
          id: id,
          items: items || [],
          ...params,
        },
      },
    });
  };

export const doCollectionDelete =
  (collectionId: string, collectionKey: ?string = undefined, keepPrivate: boolean = false) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimForClaimId(state, collectionId);
    const collection = selectCollectionForId(state, collectionId);

    const collectionDelete = async () => {
      // -- published collections are stored on claims redux, so there won't be a local key for it
      // so doAbandonClaim will take care of it.
      if (collectionKey) dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { collectionId, collectionKey } });

      if (claim && keepPrivate) {
        const newParams = Object.assign({}, collection);
        // -- doLocalCollectionCreate will use an uuid instead. otherwise the local collection will use
        // the same id as the (now deleted) claim id
        delete newParams.id;

        dispatch(doLocalCollectionCreate(newParams));
      }

      dispatch({ type: ACTIONS.DELETE_ID_FROM_LOCAL_COLLECTIONS, data: collectionId });
    };

    if (claim) {
      return dispatch(doAbandonClaim(claim, collectionDelete));
    }

    return collectionDelete();
  };

export const doToggleCollectionSavedForId = (collectionId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isSaved = selectCollectionSavedForId(state, collectionId);

  dispatch(doToast({ message: !isSaved ? __('Added to saved Playlists!') : __('Removed from saved Playlists.') }));
  dispatch({ type: ACTIONS.COLLECTION_TOGGLE_SAVE, data: collectionId });
};

const doFetchCollectionItems = (items: Array<any>, pageSize?: number) => async (dispatch: Dispatch, getState: GetState) => {
  const sortResults = (resultItems: Array<Claim>) => {
    const newItems: Array<Claim> = [];

    items.forEach((item) => {
      const index = resultItems.findIndex((i) => [i.canonical_url, i.permanent_url, i.claim_id].includes(item));

      if (index >= 0) newItems.push(resultItems[index]);
    });

    return newItems;
  };

  const mergeBatches = (arrayOfResults: Array<any>) => {
    let resultItems = [];

    arrayOfResults.forEach((result: any) => {
      // $FlowFixMe
      const claims = result.items || Object.values(result).map((item) => item.stream || item);
      resultItems = resultItems.concat(claims);
    });

    return resultItems;
  };

  try {
    const batchSize = pageSize || FETCH_BATCH_SIZE;
    const uriBatches: Array<Promise<any>> = [];
    const idBatches: Array<Promise<any>> = [];

    const totalItems = items.length;

    for (let i = 0; i < Math.ceil(totalItems / batchSize); i++) {
      const batchInitialIndex = i * batchSize;
      const batchLength = (i + 1) * batchSize;

      // --> Filter in case null/undefined are collection items
      const batchItems = items.slice(batchInitialIndex, batchLength).filter(Boolean);

      const uris = new Set([]);
      const ids = new Set([]);
      batchItems.forEach((item) => {
        if (item.startsWith('lbry://')) {
          uris.add(item);
        } else {
          ids.add(item);
        }
      });

      if (uris.size > 0) {
        uriBatches[i] = dispatch(doResolveUris(Array.from(uris), true));
      }
      if (ids.size > 0) {
        idBatches[i] = dispatch(doResolveClaimIds(Array.from(ids)));
      }
    }
    const itemsInBatches = await Promise.all([...uriBatches, ...idBatches]);
    const resultItems = sortResults(mergeBatches(itemsInBatches.filter(Boolean)));

    // The resolve calls will NOT return items when they still are in a previous call's 'Processing' state.
    let itemsWereFetching = resultItems.length !== items.length;

    // Related to above. Collection with deleted items would never get "resolved: true" status.
    // Which is needed to avoid issues when editing list before all items are resolved. (Not resolved items get removed.)
    if (itemsWereFetching) {
      const state = getState();
      const resolvingIds = selectResolvingIds(state);
      const resolvingUris = selectResolvingUris(state);
      const failedToResolveUris = selectFailedToResolveUris(state);
      const failedToResolveIds = selectFailedToResolveIds(state);
      const failedItems = failedToResolveIds.concat(failedToResolveUris);
      if (items.some((item) => failedItems.includes(item))) {
        // itemsWereFetching stays true
      } else if (uriBatches.length === 0 && idBatches.length > 0 && resolvingIds.length === 0) {
        itemsWereFetching = false;
      } else if (idBatches.length === 0 && uriBatches.length > 0 && resolvingUris.length === 0) {
        itemsWereFetching = false;
      } else if (resolvingUris.length === 0 && resolvingIds.length === 0) {
        itemsWereFetching = false;
      }
    }

    if (resultItems && !itemsWereFetching) {
      return resultItems;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};

export const doFetchItemsInCollection =
  (params: { collectionId: string, pageSize?: number }) => async (dispatch: Dispatch, getState: GetState) => {
    let state = getState();
    const { collectionId, pageSize } = params;

    const isAlreadyFetching = selectAreCollectionItemsFetchingForId(state, collectionId);

    if (isAlreadyFetching) return Promise.resolve();

    dispatch({ type: ACTIONS.COLLECTION_ITEMS_RESOLVE_START, data: collectionId });

    const isPrivate = selectHasPrivateCollectionForId(state, collectionId);
    const hasClaim = selectHasClaimForId(state, collectionId);

    // -- Resolve collections:
    if (!isPrivate && hasClaim === undefined) {
      await dispatch(doResolveClaimId(collectionId, true, { include_is_my_output: true })).finally(() => {
        // get the state after claimSearch
        state = getState();
      });
    }

    if (!isPrivate && hasClaim === null) {
      return dispatch({ type: ACTIONS.COLLECTION_ITEMS_RESOLVE_FAIL, data: collectionId });
    }

    let promisedCollectionItemsFetch, collectionItems;

    if (isPrivate) {
      const collection = selectCollectionForId(state, collectionId);

      if (collection.items.length > 0) {
        promisedCollectionItemsFetch = collection.items && dispatch(doFetchCollectionItems(collection.items, pageSize));
      } else {
        return dispatch({ type: ACTIONS.COLLECTION_ITEMS_RESOLVE_FAIL, data: collectionId });
      }
    } else {
      const claim = selectClaimForClaimId(state, collectionId);

      const claimIds = getClaimIdsInCollectionClaim(claim);
      promisedCollectionItemsFetch = claimIds && dispatch(doFetchCollectionItems(claimIds, pageSize));
    }

    // -- Await results:
    if (promisedCollectionItemsFetch) {
      collectionItems = await promisedCollectionItemsFetch;
    }

    if (!collectionItems || collectionItems?.length === undefined) {
      return dispatch({ type: ACTIONS.COLLECTION_ITEMS_RESOLVE_FAIL, data: collectionId });
    }

    const collection = selectCollectionForId(state, collectionId);
    const collectionKey = selectCollectionKeyForId(state, collectionId);

    if (isPrivate) {
      const newItems = collectionItems.map((item) => item.permanent_url);

      const newPrivateCollection = { ...collection, items: newItems, key: collectionKey };

      return dispatch({
        type: ACTIONS.COLLECTION_ITEMS_RESOLVE_SUCCESS,
        data: { resolvedCollection: newPrivateCollection },
      });
    } else {
      const claim = selectClaimForClaimId(state, collectionId);

      const { value } = claim;
      const { tags } = value || {};

      const claimIds = getClaimIdsInCollectionClaim(claim) || [];

      const valueTypes = new Set();
      const streamTypes = new Set();
      const newItems = new Set();

      claimIds.forEach((claimId, index) => {
        const collectionItem = collectionItems[index];

        if (collectionItem) {
          newItems.add(collectionItem.claim_id);
          valueTypes.add(collectionItem.value_type);
          if (collectionItem.value.stream_type) {
            streamTypes.add(collectionItem.value.stream_type);
          }
        } else {
          newItems.add(claimId);
        }
      });

      const collectionType = resolveCollectionType(tags, valueTypes, streamTypes);

      const newStoreCollectionClaim = {
        ...collection,
        items: Array.from(newItems),
        itemCount: newItems.size,
        type: collectionType,
        ...resolveAuxParams(collectionType, claim),
      };

      return dispatch(
        batchActions(
          { type: ACTIONS.COLLECTION_ITEMS_RESOLVE_SUCCESS, data: { resolvedCollection: newStoreCollectionClaim } },
          { type: ACTIONS.COLLECTION_CLAIM_ITEMS_RESOLVE_COMPLETE, data: newStoreCollectionClaim }
        )
      );
    }
  };

export const doFetchThumbnailClaimsForCollectionIds =
  (params: { collectionIds: Array<any>, pageSize?: number }) => async (dispatch: Dispatch, getState: GetState) => {
    let state = getState();
    const { collectionIds, pageSize } = params;

    const collectionIdsStr = collectionIds.toString();
    const isAlreadyFetching = selectAreThumbnailClaimsFetchingForCollectionIds(state, collectionIdsStr);

    if (isAlreadyFetching) return Promise.resolve();

    dispatch({ type: ACTIONS.COLLECTION_THUMBNAIL_CLAIMS_RESOLVE_START, data: collectionIdsStr });

    const allClaimIds = new Set();

    collectionIds.forEach((collectionId) => {
      const collection = selectCollectionForId(state, collectionId);
      const thumbnailClaims = collection.items.slice(0, 3);

      if (collection && collection.items) {
        thumbnailClaims.forEach((claimId) => allClaimIds.add(claimId));
      }
    });

    return await dispatch(doFetchCollectionItems(Array.from(allClaimIds), pageSize)).finally(() =>
      dispatch({ type: ACTIONS.COLLECTION_THUMBNAIL_CLAIMS_RESOLVE_COMPLETE, data: collectionIdsStr })
    );
  };

export const doSortCollectionByKey =
  (collectionId: string, sortByKey: string, sortOrder: string) => async (dispatch: Dispatch, getState: GetState) => {
    let state = getState();
    const collection: Collection = selectCollectionForId(state, collectionId);

    // Get claims or return the uri/claimId if not resolved
    const claims = collection.items.map((item) => {
      // Item should be either claim_id or permanent url
      const claimIdMatch = item.match(/[a-f|0-9]{40}$/);
      const claimId = claimIdMatch ? claimIdMatch[0] : null;
      return claimId ? selectClaimForClaimId(state, claimId) : item;
    });

    // Save unresolved uris
    const resolvedClaims = claims.filter((claim) => typeof claim !== 'string');
    const unresolvedItems = claims.filter((claim) => typeof claim === 'string');

    // $FlowIgnore
    const sortedClaims = resolvedClaims.sort((a, b) => {
      if (sortByKey === COLS.SORT_KEYS.RELEASED_AT) {
        const keyA = a?.value?.release_time || a?.meta?.creation_timestamp || 0;
        const keyB = b?.value?.release_time || b?.meta?.creation_timestamp || 0;
        if (sortOrder === COLS.SORT_ORDER.ASC) {
          return keyB - keyA;
        } else if (sortOrder === COLS.SORT_ORDER.DESC) {
          return keyA - keyB;
        }
      }

      if (sortByKey === COLS.SORT_KEYS.NAME) {
        const keyA = a?.value?.title || a?.meta?.name || 'A';
        const keyB = b?.value?.title || b?.meta?.name || 'A';

        if (sortOrder === COLS.SORT_ORDER.ASC) {
          return keyB.localeCompare(keyA, undefined, { numeric: true, sensitivity: 'base' });
        } else if (sortOrder === COLS.SORT_ORDER.DESC) {
          return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
        }
      }
    });

    let sortedUris = sortedClaims.map((claim) => claim?.permanent_url);
    sortedUris = sortedUris.concat(unresolvedItems);

    return dispatch({
      type: ACTIONS.COLLECTION_EDIT,
      data: {
        collectionKey: COLS.KEYS.UNSAVED_CHANGES,
        collection: {
          ...collection,
          items: sortedUris,
          itemCount: sortedUris.length,
        },
      },
    });
  };

export const doCollectionEdit =
  (collectionId: string, params: CollectionEditParams) => async (dispatch: Dispatch, getState: GetState) => {
    let state = getState();
    const collection: Collection = selectCollectionForId(state, collectionId);

    if (!collection) {
      return dispatch(doToast({ message: __('Collection does not exist.'), isError: true }));
    }

    const isPublic = Boolean(selectResolvedCollectionForId(state, collectionId));
    const isPrivateVersion = selectHasPrivateCollectionForId(state, collectionId);
    const { uris, remove, replace, order, type, isPreview } = params;

    let hasItemsResolved = selectCollectionHasItemsResolvedForId(state, collectionId);
    if (!hasItemsResolved && !isPrivateVersion) {
      await dispatch(doFetchItemsInCollection({ collectionId }));
      state = getState();
      hasItemsResolved = selectCollectionHasItemsResolvedForId(state, collectionId);
    }
    if (!hasItemsResolved && !isPrivateVersion) {
      return dispatch(doToast({ message: __('Failed to resolve collection items. Please try again.'), isError: true }));
    }

    const collectionUrls = selectUrlsForCollectionId(state, collectionId);

    const currentUrls = collectionUrls ? collectionUrls.concat() : [];
    const currentUrlsSet = new Set(currentUrls);
    let newItems = currentUrls;

    // Passed uris to add/remove:
    if (uris) {
      if (replace) {
        newItems = uris;
      } else if (remove) {
        const urisToFilter = uris.map((uri) => selectCollectionForIdClaimForUriItem(state, collectionId, uri));

        // Filters (removes) the passed uris from the current list items
        newItems = currentUrls.filter((uri) => uri && (!uris || !urisToFilter.includes(uri)));
      } else {
        // Pushes (adds to the end) the passed uris to the current list items
        // (only if item not already in currentUrls, avoid duplicates)
        uris.forEach((url) => !currentUrlsSet.has(url) && newItems.push(url));
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

    const isQueue = collectionId === COLS.QUEUE_ID;
    const title = params.title || params.name;

    return new Promise((success) => {
      dispatch({
        // -- queue specific action prevents attempting to sync settings and throwing errors on unauth users
        type: isQueue ? ACTIONS.QUEUE_EDIT : ACTIONS.COLLECTION_EDIT,
        data: {
          collectionKey: isPreview
            ? COLS.KEYS.UNSAVED_CHANGES
            : isPublic
            ? COLS.KEYS.EDITED
            : selectCollectionKeyForId(state, collectionId),
          collection: {
            ...collection,
            items: newItems,
            itemCount: newItems.length,
            // this means pass description even if undefined or null, but not if it's not passed at all, so it can be deleted
            ...('description' in params ? { description: params.description } : {}),
            ...(title ? { name: title, title } : {}),
            ...(type ? { type } : {}),
            ...(params.thumbnail_url ? { thumbnail: { url: params.thumbnail_url } } : {}),
          },
        },
      });
      success();
    });
  };

export const doClearEditsForCollectionId = (id: String) => (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { id, collectionKey: 'edited' } });
  dispatch({ type: ACTIONS.COLLECTION_EDIT, data: { collectionKey: COLS.KEYS.UPDATED, collection: { id } } });
};

export const doRemoveFromUpdatedCollectionsForCollectionId = (id: string) => (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { id, collectionKey: 'updated' } });
};

export const doRemoveFromUnsavedChangesCollectionsForCollectionId = (id: string) => (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { id, collectionKey: 'unsavedChanges' } });
};

export const doClearQueueList = () => (dispatch: Dispatch, getState: GetState) =>
  dispatch({ type: ACTIONS.QUEUE_CLEAR });
