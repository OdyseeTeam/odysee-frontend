// @flow
import * as ACTIONS from 'constants/action_types';
import { v4 as uuid } from 'uuid';
import Lbry from 'lbry';
import {
  doAbandonClaim,
  doResolveUris,
  doResolveClaimIds,
  doCheckPendingClaims,
  processResolveResult,
} from 'redux/actions/claims';
import { selectClaimForClaimId, selectClaimForId, makeSelectMetadataItemForUri } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectEditedCollectionForId,
  selectCollectionHasEditsForId,
  selectUrlsForCollectionId,
  selectIsCollectionSavedForId,
  selectFeaturedChannelsByChannelId,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectClaimIdsForCollectionId,
  selectIsCollectionItemsFetchingForId,
  selectIsCollectionPrivateForId,
  selectCollectionKeyForId,
  selectPublishedCollectionForId,
} from 'redux/selectors/collections';
import * as COLS from 'constants/collections';
import { resolveAuxParams, resolveCollectionType } from 'util/collections';
import { getThumbnailFromClaim, isPermanentUrl, isCanonicalUrl } from 'util/claim';
import { sanitizeName } from 'util/lbryURI';
import { creditsToString } from 'util/format-credits';
import { doError, doToast } from 'redux/actions/notifications';
import { batchActions } from 'util/batch-actions';

const FETCH_BATCH_SIZE = 50;

export const doFetchCollectionListMine = (
  options: { page: number, page_size: number, resolve_claims?: number, resolve?: boolean } = {
    page: 1,
    page_size: 50,
    resolve_claims: 1,
    resolve: true,
  }
) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.COLLECTION_LIST_MINE_STARTED });

  const failure = (error) => dispatch({ type: ACTIONS.COLLECTION_LIST_MINE_COMPLETE });

  const autoPaginate = () => {
    let allClaims = [];

    const next = async (response: CollectionListResponse) => {
      const moreData = response.items.length === options.page_size;
      allClaims = allClaims.concat(response.items);
      options.page++;

      if (!moreData) {
        // -- Add collection claims to myClaims
        return dispatch(
          batchActions(
            { type: ACTIONS.FETCH_CLAIM_LIST_MINE_COMPLETED, data: { result: response } },
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

export function doCollectionPublish(options: CollectionPublishParams, collectionId: string, cb?: () => void) {
  return (dispatch: Dispatch, getState: GetState): Promise<any> => {
    const state = getState();
    const isPrivate = selectIsCollectionPrivateForId(state, collectionId);

    const params: GenericUploadParams = {
      channel_id: options.channel_id,
      bid: creditsToString(options.bid),
      blocking: true,
      title: options.title,
      thumbnail_url: options.thumbnail_url,
      tags: options.tags,
      languages: options.languages || [],
      description: options.description,
    };
    const fullParams = {};

    if (isPrivate) {
      const publishParams: CollectionPublishParams = {
        ...params,
        name: options.name,
        // -- avoid duplicates --
        claims: Array.from(new Set(options.claims)),
      };

      Object.assign(fullParams, publishParams);
    } else {
      const updateParams: CollectionUpdateParams = {
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
        dispatch(doToast({ message: error.message }));
        reject(error);
        throw new Error(error);
      }

      return publishFn(fullParams).then(success, failure);
    });
  };
}

export const doLocalCollectionCreate = (params: CollectionLocalCreateParams, cb?: (id: any) => void) => (
  dispatch: Dispatch,
  getState: GetState
) => {
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
          description: sourceDescription,
          thumbnail: { url: thumbnailUrl },
        },
      },
    });
  }

  return dispatch({ type: ACTIONS.COLLECTION_NEW, data: { entry: { id: id, items: items || [], ...params } } });
};

export const doCollectionDelete = (
  collectionId: string,
  collectionKey: ?string = undefined,
  keepPrivate: boolean = false
) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const claim = selectClaimForClaimId(state, collectionId);

  const collectionDelete = async () => {
    // -- published collections are stored on claims redux, so there won't be a local key for it
    // so doAbandonClaim will take care of it.
    if (collectionKey) dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { collectionId, collectionKey } });

    if (claim && keepPrivate) {
      // get the item uris to fill in the params
      await dispatch(doFetchItemsInCollection({ collectionId })).then(() => {
        const newParams = Object.assign({}, selectPublishedCollectionForId(state, collectionId));
        // -- doLocalCollectionCreate will use an uuid instead. otherwise the local collection will use
        // the same id as the (now deleted) claim id
        delete newParams.id;

        dispatch(doLocalCollectionCreate(newParams));
      });
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
  const isSaved = selectIsCollectionSavedForId(state, collectionId);

  dispatch(doToast({ message: !isSaved ? __('Added to saved Playlists!') : __('Removed from saved Playlists.') }));
  dispatch({ type: ACTIONS.COLLECTION_TOGGLE_SAVE, data: collectionId });
};

export const doFetchItemsInCollections = (resolveItemsOptions: {
  collectionIds: Array<string>,
  pageSize?: number,
  itemCount?: number,
}) => async (dispatch: Dispatch, getState: GetState) => {
  /*
  1) make sure all the collection claims are loaded into claims reducer, search/resolve if necessary.
  2) get the item claims for each
  3) format and make sure they're in the order as in the claim
  4) Build the collection objects and update collections reducer
   */
  let state = getState();
  const { collectionIds: passedIds, pageSize, itemCount } = resolveItemsOptions;

  const collectionIds = passedIds.filter((id) => {
    const isAlreadyFetching = selectIsCollectionItemsFetchingForId(state, id);
    return !isAlreadyFetching;
  });

  if (collectionIds.length === 0) return Promise.resolve();

  dispatch({ type: ACTIONS.COLLECTION_ITEMS_RESOLVE_STARTED, data: collectionIds });

  // Do not resolve if is private or already resolved
  const collectionIdsToResolve = collectionIds.filter((id) => {
    const isPrivate = selectIsCollectionPrivateForId(state, id);
    const isAlreadyResolved = selectClaimForId(state, id);
    return !isPrivate && !isAlreadyResolved;
  });

  // -- Resolve collections:
  if (collectionIdsToResolve.length) {
    await dispatch(doResolveClaimIds(collectionIdsToResolve));
    // get the state after claimSearch
    state = getState();
  }

  async function fetchItemsForCollectionClaim(collectionId: string, collectionItemsInOrder: Array<string>) {
    const sortResults = (items: Array<Claim>, collectionItemsInOrder: Array<string>) => {
      const newItems: Array<Claim> = [];
      collectionItemsInOrder.forEach((uri) => {
        const index = items.findIndex((i) => [i.canonical_url, i.permanent_url, i.claim_id].includes(uri));
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

    const mergeBatches = (arrayOfResults: Array<any>, collectionItemsInOrder: Array<string>) => {
      const mergedResults: { items: Array<Claim>, total_items: number } = {
        items: [],
        total_items: 0,
      };
      arrayOfResults.forEach((result) => {
        // $FlowFixMe
        const claims = result.items || Object.values(result).map((item) => item.stream || item);
        // $FlowFixMe
        mergedResults.items = mergedResults.items.concat(claims);
        // $FlowFixMe
        mergedResults.total_items = mergedResults.total_items + claims.length;
      });

      mergedResults.items = sortResults(mergedResults.items, collectionItemsInOrder);
      return mergedResults;
    };

    // try {
    const batchSize = pageSize || FETCH_BATCH_SIZE;
    const batches: Array<Promise<any>> = [];

    const totalItems = collectionItemsInOrder.length;
    for (let i = 0; i < Math.ceil(totalItems / batchSize); i++) {
      const batchInitialIndex = i * batchSize;
      const batchLength = (i + 1) * batchSize;

      // --> Filter in case null/undefined are collection items
      const batchItems = collectionItemsInOrder.slice(batchInitialIndex, batchLength).filter(Boolean);

      const uris = new Set([]);
      const ids = new Set([]);
      batchItems.forEach((item) => {
        if (isCanonicalUrl(item) || isPermanentUrl(item)) {
          uris.add(item);
        } else {
          ids.add(item);
        }
      });

      if (uris.size > 0) {
        batches[i] = dispatch(doResolveUris(Array.from(uris), true));
      } else if (ids.size > 0) {
        batches[i] = dispatch(doResolveClaimIds(Array.from(ids)));
      }
    }
    const itemsInBatches = await Promise.all(batches);
    const result = mergeBatches(itemsInBatches.filter(Boolean), collectionItemsInOrder);

    // $FlowFixMe
    const itemsById: { collectionId: string, items?: ?Array<GenericClaim> } = { collectionId };
    if (result.items) {
      itemsById.items = result.items;
    } else {
      itemsById.items = null;
    }
    return itemsById;
    // } catch (e) {
    //   return { collectionId, items: null };
    // }
  }

  const invalidCollectionIds = [];
  const promisedCollectionItemFetches = [];
  let collectionItemsById: Array<CollectionItemFetchResult> = [];

  // -- Collect requests for resolving items in each collection:
  collectionIds.forEach((collectionId) => {
    // If has edits, resolve the edited items since they can be different from the published claim items
    const hasEdits = selectCollectionHasEditsForId(state, collectionId);

    if (selectIsCollectionPrivateForId(state, collectionId) || hasEdits) {
      const collection = selectCollectionForId(state, collectionId);

      if (collection.items.length > 0) {
        const items = itemCount ? collection.items.slice(0, itemCount) : collection.items;
        promisedCollectionItemFetches.push(fetchItemsForCollectionClaim(collectionId, items));
      } else {
        const collectionItem: CollectionItemFetchResult = { collectionId, items: [] };
        collectionItemsById.push(collectionItem);
      }
    } else {
      const claim = selectClaimForClaimId(state, collectionId);

      if (!claim) {
        invalidCollectionIds.push(collectionId);
      } else {
        const items = itemCount ? claim.value.claims.slice(0, itemCount) : claim.value.claims;
        promisedCollectionItemFetches.push(fetchItemsForCollectionClaim(collectionId, items));
      }
    }
  });

  // -- Await results:
  if (promisedCollectionItemFetches.length > 0) collectionItemsById = await Promise.all(promisedCollectionItemFetches);

  const newCollectionObjectsById = {};
  const privateCollectionObjectsById = {};

  // -- Process results:
  collectionItemsById.forEach((entry) => {
    // $FlowFixMe
    const collectionItems: Array<any> = entry.items;
    const collectionId = entry.collectionId;

    if (!collectionItems?.length) {
      invalidCollectionIds.push(collectionId);
      return;
    }

    if (selectIsCollectionPrivateForId(state, collectionId)) {
      let newItems = [];

      collectionItems.forEach((collectionItem) => newItems.push(collectionItem.permanent_url));

      privateCollectionObjectsById[collectionId] = {
        ...selectCollectionForId(state, collectionId),
        items: newItems,
        key: selectCollectionKeyForId(state, collectionId),
      };
    } else {
      const claim = selectClaimForClaimId(state, collectionId);

      const { items: editedCollectionItems } = selectEditedCollectionForId(state, collectionId) || {};
      const { name, timestamp, value } = claim || {};
      const { title, description, thumbnail } = value;
      const valueTypes = new Set();
      const streamTypes = new Set();

      let newItems = [];
      let collectionType;

      collectionItems.forEach((collectionItem) => {
        newItems.push(collectionItem.permanent_url);
        valueTypes.add(collectionItem.value_type);
        if (collectionItem.value.stream_type) {
          streamTypes.add(collectionItem.value.stream_type);
        }
      });

      collectionType = resolveCollectionType(value.tags, valueTypes, streamTypes);

      newCollectionObjectsById[collectionId] = {
        items: newItems,
        id: collectionId,
        name: title || name,
        itemCount: claim.value.claims.length,
        type: collectionType,
        createdAt: claim.meta?.creation_timestamp,
        updatedAt: timestamp,
        description,
        thumbnail,
        key: editedCollectionItems === collectionItems ? 'edited' : undefined,
        ...resolveAuxParams(collectionType, claim),
      };
    }
  });

  const resolveInfo: ClaimActionResolveInfo = {};

  collectionItemsById.forEach(
    (collection) =>
      // GenericClaim type probably needs to be updated to avoid this "Any"
      collection.items &&
      collection.items.forEach((result: any) => {
        result = { [result.permanent_url]: result };
        processResolveResult(result, resolveInfo);
      })
  );

  return dispatch(
    batchActions(
      {
        type: ACTIONS.COLLECTION_ITEMS_RESOLVE_SUCCESS,
        data: {
          resolvedCollections: { ...newCollectionObjectsById, ...privateCollectionObjectsById },
          failedCollectionIds: invalidCollectionIds,
        },
      },
      { type: ACTIONS.COLLECTION_CLAIM_ITEMS_RESOLVE_COMPLETE, data: newCollectionObjectsById }
    )
  );
};

export const doFetchItemsInCollection = ({
  collectionId,
  pageSize,
  itemCount,
}: {
  collectionId: string,
  pageSize?: number,
  itemCount?: number,
}) => (dispatch: Dispatch) => {
  const newOptions: { collectionIds: Array<string>, pageSize?: number, itemCount?: number } = {
    collectionIds: [collectionId],
  };
  if (pageSize) newOptions.pageSize = pageSize;
  if (itemCount) newOptions.itemCount = itemCount;

  return dispatch(doFetchItemsInCollections(newOptions));
};

export const doCollectionEdit = (collectionId: string, params: CollectionEditParams) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState();
  const collection: Collection = selectCollectionForId(state, collectionId);

  if (!collection) {
    return dispatch(doToast({ message: __('Collection does not exist.'), isError: true }));
  }

  const isPublic = Boolean(selectPublishedCollectionForId(state, collectionId));

  const { uris, remove, replace, order, type } = params;

  const currentUrls = collection.items ? collection.items.concat() : [];
  const currentUrlsSet = new Set(currentUrls);
  let newItems = currentUrls;

  // Passed uris to add/remove:
  if (uris) {
    const urisSet = new Set(uris);

    if (replace) {
      newItems = uris;
    } else if (remove) {
      // Filters (removes) the passed uris from the current list items
      newItems = currentUrls.filter((url) => url && (!uris || !urisSet.has(url)));
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

  return dispatch({
    // -- queue specific action prevents attempting to sync settings and throwing errors on unauth users
    type: isQueue ? ACTIONS.QUEUE_EDIT : ACTIONS.COLLECTION_EDIT,
    data: {
      collectionKey: isPublic ? COLS.KEYS.EDITED : selectCollectionKeyForId(state, collectionId),
      collection: {
        ...collection,
        items: newItems,
        ...(type ? { type } : {}),
        ...(title ? { name: title, title } : {}),
        ...(params.description ? { description: params.description } : {}),
        ...(params.thumbnail ? { thumbnail: params.thumbnail } : {}),
      },
    },
  });
};

export const doClearEditsForCollectionId = (id: String) => (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.COLLECTION_DELETE, data: { id, collectionKey: 'edited' } });
  dispatch({ type: ACTIONS.COLLECTION_EDIT, data: { collectionKey: COLS.KEYS.UPDATED, collection: { id } } });
};

export const doClearQueueList = () => (dispatch: Dispatch, getState: GetState) =>
  dispatch({ type: ACTIONS.QUEUE_CLEAR });

export const doPublishFeaturedChannels = (channelId: ChannelId) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const featuredChannelsIds = selectFeaturedChannelsByChannelId(state)[channelId];
  const eList = selectMyEditedCollections(state);
  const uList = selectMyUnpublishedCollections(state);

  const errors: Array<Error> = [];

  if (featuredChannelsIds) {
    dispatch({ type: ACTIONS.COLLECTION_FC_PUBLISH_STARTED });
    let useDelay = false;

    for (let i = 0; i < featuredChannelsIds.length; ++i) {
      const fcId = featuredChannelsIds[i];
      const fcCollection = selectCollectionForId(state, fcId);

      const common = {
        channel_id: channelId,
        // $FlowFixMe
        tags: [{ name: COLS.SECTION_TAGS.FEATURED_CHANNELS }],
        bid: '0.0001',
        claims: selectClaimIdsForCollectionId(state, fcId).filter(Boolean), // remove falseys.
        title: fcCollection.name,
        blocking: true,
      };

      if (eList[fcId]) {
        const fcClaim = selectClaimForClaimId(state, fcId);
        const options = { name: fcClaim.name, claim_id: fcClaim.claim_id, ...common };
        await dispatch(doCollectionPublish(options, fcId)).catch((err) => errors.push(err));
      } else if (uList[fcId]) {
        const options = { name: `${sanitizeName(fcCollection.name)}--${fcId}`, ...common };
        await dispatch(doCollectionPublish(options, fcId)).catch((err) => errors.push(err));
        useDelay = true;
      }
    }

    if (errors.length) {
      dispatch(
        doError({
          message: 'Failed to create/update Featured Channels list.',
          cause: {
            list: errors.map((x) => x.message).join(','),
          },
        })
      );
    }

    if (useDelay) {
      // TODO: batch-action problem?
      setTimeout(() => dispatch({ type: ACTIONS.COLLECTION_FC_PUBLISH_COMPLETED }), 5000);
    } else {
      dispatch({ type: ACTIONS.COLLECTION_FC_PUBLISH_COMPLETED });
    }

    return errors;
  }
};
