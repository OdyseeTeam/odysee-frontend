// @flow

// This file has a lot of FlowFixMe comments
// It's due to Flow's support of Object.{values,entries}
// https://github.com/facebook/flow/issues/2221
// We could move to es6 Sets/Maps, but those are not recommended for redux
// https://github.com/reduxjs/redux/issues/1499
// Unsure of the best solution at the momentf
// - Sean

import * as ACTIONS from 'constants/action_types';
import mergeClaim from 'util/merge-claim';
import { getChannelIdFromClaim } from 'util/claim';
import { claimToStoredCollection } from 'util/collections';

type State = {
  createChannelError: ?string,
  channelClaimCounts: { [string]: number },
  claimsByUri: { [string]: string },
  byId: { [string]: Claim },
  pendingById: { [string]: Claim }, // keep pending claims
  resolvingIds: Array<string>,
  resolvingUris: Array<string>,
  reflectingById: { [string]: ReflectingUpdate },
  myClaims: ?Array<string>,
  myChannelClaimsById: ?{ [channelClaimId: string]: ChannelClaim },
  resolvedCollectionsById: { [collectionClaimId: string]: Collection },
  myCollectionClaimIds: ?Array<string>,
  abandoningById: { [string]: boolean },
  fetchingChannelClaims: { [string]: number },
  fetchingMyChannels: boolean,
  fetchingClaimSearchByQuery: { [string]: boolean },
  purchaseUriSuccess: boolean,
  myPurchases: ?Array<string>,
  myPurchasesPageNumber: ?number,
  myPurchasesPageTotalResults: ?number,
  fetchingMyPurchases: boolean,
  fetchingMyPurchasesError: ?string,
  claimSearchByQuery: { [string]: Array<string> },
  claimSearchByQueryLastPageReached: { [string]: Array<boolean> },
  creatingChannel: boolean,
  paginatedClaimsByChannel: {
    [string]: {
      all: Array<string>,
      pageCount: number,
      itemCount: number,
      [number]: Array<string>,
    },
  },
  updateChannelError: ?string,
  updatingChannel: boolean,
  pendingChannelImport: string | boolean,
  repostLoading: boolean,
  repostError: ?string,
  fetchingClaimListMinePageError: ?string,
  myClaimsPageResults: Array<string>,
  myClaimsPageNumber: ?number,
  myClaimsPageTotalResults: ?number,
  isFetchingClaimListMine: boolean,
  isCheckingNameForPublish: boolean,
  checkingPending: boolean,
  checkingReflecting: boolean,
  latestByUri: { [string]: any },
  myPurchasedClaims: Array<any>, // bad naming; not a claim but a stripe response.
  fetchingMyPurchasedClaims: ?boolean,
  fetchingMyPurchasedClaimsError: ?string,
  costInfosById: { [claimId: string]: CostInfo },
};

const reducers = {};
const defaultState = {
  byId: {},
  claimsByUri: {},
  paginatedClaimsByChannel: {},
  channelClaimCounts: {},
  fetchingChannelClaims: {},
  resolvingUris: [],
  resolvingIds: [],
  myChannelClaimsById: undefined,
  resolvedCollectionsById: {},
  myCollectionClaimIds: undefined,
  myClaims: undefined,
  myPurchases: undefined,
  myPurchasesPageNumber: undefined,
  myPurchasesPageTotalResults: undefined,
  purchaseUriSuccess: false,
  fetchingMyPurchases: false,
  fetchingMyPurchasesError: undefined,
  fetchingMyChannels: false,
  abandoningById: {},
  pendingById: {},
  reflectingById: {},
  claimSearchError: false,
  claimSearchByQuery: {},
  claimSearchByQueryLastPageReached: {},
  fetchingClaimSearchByQuery: {},
  updateChannelError: '',
  updatingChannel: false,
  creatingChannel: false,
  createChannelError: undefined,
  pendingChannelImport: false,
  repostLoading: false,
  repostError: undefined,
  fetchingClaimListMinePageError: undefined,
  myClaimsPageResults: [],
  myClaimsPageNumber: undefined,
  myClaimsPageTotalResults: undefined,
  isFetchingClaimListMine: false,
  isFetchingMyPurchases: false,
  isCheckingNameForPublish: false,
  checkingPending: false,
  checkingReflecting: false,
  latestByUri: {},
  myPurchasedClaims: [],
  fetchingMyPurchasedClaims: undefined,
  fetchingMyPurchasedClaimsError: undefined,
  costInfosById: {},
};

// ****************************************************************************
// Helpers
// ****************************************************************************

function isObjEmpty(object: any) {
  return Object.keys(object).length === 0;
}

function resolveDelta(original: any, delta: any) {
  if (isObjEmpty(delta)) {
    // Don't invalidate references when there are no changes, so return original.
    return original;
  } else {
    // When there are changes: create a new object, spread existing references,
    // and overwrite specific items with new data.
    return { ...original, ...delta };
  }
}

function claimHasNewData(original, fresh) {
  // Don't blow away 'is_my_output' just because the next query didn't ask for it.
  const ignoreIsMyOutput = original.is_my_output !== undefined && fresh.is_my_output === undefined;

  // Something is causing the tags to be re-ordered differently
  // (https://github.com/OdyseeTeam/odysee-frontend/issues/116#issuecomment-962747147).
  // Just do a length comparison for now, which covers 99% of cases while we
  // figure out what's causing the order to change.
  const ignoreTags =
    original &&
    original.value &&
    original.value.tags &&
    original.value.tags.length &&
    fresh &&
    fresh.value &&
    fresh.value.tags &&
    fresh.value.tags.length &&
    original.value.tags.length !== fresh.value.tags.length;

  const excludeKeys = (key, value) => {
    if (key === 'confirmations' || (ignoreTags && key === 'tags') || (ignoreIsMyOutput && key === 'is_my_output')) {
      return undefined;
    }

    return value;
  };

  const originalStringified = JSON.stringify(original, excludeKeys);
  const freshStringified = JSON.stringify(fresh, excludeKeys);

  return originalStringified !== freshStringified;
}

/**
 * Adds the new value to the delta if the value is not present in the original.
 *
 * @param original The original state object.
 * @param delta The delta state object containing a list of changes.
 * @param key
 * @param newValue
 */
function updateIfValueEmpty(original, delta, key, newValue) {
  if (!original[key]) {
    delta[key] = newValue;
  }
}

/**
 * Adds the new value to the delta if the value is different from the original.
 *
 * @param original The original state object.
 * @param delta The delta state object containing a list of changes.
 * @param key
 * @param newValue
 */
function updateIfValueChanged(original, delta, key, newValue) {
  if (original[key] !== newValue) {
    delta[key] = newValue;
  }
}

/**
 * Adds the new claim to the delta if the claim contains changes that the GUI
 * would care about.
 *
 * @param original The original state object.
 * @param delta The delta state object containing a list of changes.
 * @param key
 * @param newClaim
 */
function updateIfClaimChanged(original, delta, key, newClaim) {
  if (!original[key] || claimHasNewData(original[key], newClaim)) {
    delta[key] = newClaim;
  }
}

function selectClaimIsMine(state: State, claim: Claim) {
  if (claim.is_my_output) {
    return true;
  }

  const { myChannelClaimsById, myClaims } = state;

  if (new Set(myClaims).has(claim.claim_id)) {
    return true;
  }

  if (myChannelClaimsById) {
    const signingChannelId = getChannelIdFromClaim(claim);

    if (signingChannelId && signingChannelId in myChannelClaimsById) {
      return true;
    }
  }

  return false;
}

// ****************************************************************************
// handleClaimAction
// ****************************************************************************

function handleClaimAction(state: State, action: any): State {
  const { resolveInfo, query }: { resolveInfo: ClaimActionResolveInfo, query?: string } = action.data;
  const { claim_ids: queryClaimIds } = query ? JSON.parse(query) : {};

  const byUriDelta = {};
  const byIdDelta = {};
  const channelClaimCounts = Object.assign({}, state.channelClaimCounts);
  const pendingById = state.pendingById;
  let newResolvingUrls = new Set(state.resolvingUris);
  const myClaimIds = new Set(state.myClaims);
  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  let newMyCollectionClaimIds =
    state.myCollectionClaimIds && new Set(state.myCollectionClaimIds) && new Set(state.myCollectionClaimIds);

  Object.entries(resolveInfo).forEach(([url, resolveResponse]) => {
    // $FlowFixMe
    const { claimsInChannel, stream, channel: channelFromResolve, collection } = resolveResponse;
    const channel = channelFromResolve || (stream && stream.signing_channel);
    const repostSrcChannel = stream && stream.reposted_claim ? stream.reposted_claim.signing_channel : null;

    if (stream) {
      if (pendingById[stream.claim_id]) {
        byIdDelta[stream.claim_id] = mergeClaim(stream, state.byId[stream.claim_id]);
      } else {
        updateIfClaimChanged(state.byId, byIdDelta, stream.claim_id, stream);
      }

      updateIfValueChanged(state.claimsByUri, byUriDelta, url, stream.claim_id);

      // If url isn't a canonical_url, make sure that is added too
      updateIfValueChanged(state.claimsByUri, byUriDelta, stream.canonical_url, stream.claim_id);

      // Also add the permanent_url here until lighthouse returns canonical_url for search results
      updateIfValueChanged(state.claimsByUri, byUriDelta, stream.permanent_url, stream.claim_id);
      newResolvingUrls.delete(stream.canonical_url);
      newResolvingUrls.delete(stream.permanent_url);

      if (stream.value_type === 'collection') {
        if (!newResolvedCollectionsById[stream.claim_id]) {
          // $FlowFixMe
          newResolvedCollectionsById[stream.claim_id] = claimToStoredCollection(stream);
        }
      }

      if (selectClaimIsMine(state, stream)) {
        myClaimIds.add(stream.claim_id);

        if (stream.value_type === 'collection') {
          if (!newMyCollectionClaimIds) newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
          newMyCollectionClaimIds.add(stream.claim_id);
        }
      }
    }

    if (channel && channel.claim_id) {
      if (!stream) {
        updateIfValueChanged(state.claimsByUri, byUriDelta, url, channel.claim_id);
      }

      if (claimsInChannel) {
        channelClaimCounts[url] = claimsInChannel;
        channelClaimCounts[channel.canonical_url] = claimsInChannel;
      }

      if (pendingById[channel.claim_id]) {
        byIdDelta[channel.claim_id] = mergeClaim(channel, state.byId[channel.claim_id]);
      } else {
        updateIfClaimChanged(state.byId, byIdDelta, channel.claim_id, channel);
      }

      updateIfValueChanged(state.claimsByUri, byUriDelta, channel.permanent_url, channel.claim_id);
      updateIfValueChanged(state.claimsByUri, byUriDelta, channel.canonical_url, channel.claim_id);
      newResolvingUrls.delete(channel.canonical_url);
      newResolvingUrls.delete(channel.permanent_url);
    }

    if (repostSrcChannel && repostSrcChannel.claim_id) {
      updateIfClaimChanged(state.byId, byIdDelta, repostSrcChannel.claim_id, repostSrcChannel);
      updateIfValueChanged(state.claimsByUri, byUriDelta, repostSrcChannel.permanent_url, repostSrcChannel.claim_id);
      updateIfValueChanged(state.claimsByUri, byUriDelta, repostSrcChannel.canonical_url, repostSrcChannel.claim_id);
    }

    if (collection) {
      if (pendingById[collection.claim_id]) {
        byIdDelta[collection.claim_id] = mergeClaim(collection, state.byId[collection.claim_id]);
      } else {
        updateIfClaimChanged(state.byId, byIdDelta, collection.claim_id, collection);
      }

      updateIfValueChanged(state.claimsByUri, byUriDelta, url, collection.claim_id);
      updateIfValueChanged(state.claimsByUri, byUriDelta, collection.canonical_url, collection.claim_id);
      updateIfValueChanged(state.claimsByUri, byUriDelta, collection.permanent_url, collection.claim_id);
      newResolvingUrls.delete(collection.canonical_url);
      newResolvingUrls.delete(collection.permanent_url);

      // $FlowFixMe
      newResolvedCollectionsById[collection.claim_id] = claimToStoredCollection(collection);

      if (selectClaimIsMine(state, collection)) {
        myClaimIds.add(collection.claim_id);

        if (!newMyCollectionClaimIds) newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
        newMyCollectionClaimIds.add(collection.claim_id);
      }
    }

    newResolvingUrls.delete(url);
    if (!stream && !channel && !collection && !pendingById[state.claimsByUri[url]]) {
      updateIfValueChanged(state.claimsByUri, byUriDelta, url, null);
    }
  });

  const byId = resolveDelta(state.byId, byIdDelta);

  if (queryClaimIds) {
    queryClaimIds.forEach((claimId) => {
      if (!byId[claimId]) {
        Object.assign(byId, { [claimId]: null });
      }
    });
  }

  return Object.assign({}, state, {
    byId,
    claimsByUri: resolveDelta(state.claimsByUri, byUriDelta),
    channelClaimCounts,
    resolvingUris: Array.from(newResolvingUrls),
    resolvedCollectionsById: newResolvedCollectionsById,
    myCollectionClaimIds: newMyCollectionClaimIds && Array.from(newMyCollectionClaimIds),
    ...(!state.myClaims || myClaimIds.size !== state.myClaims.length ? { myClaims: Array.from(myClaimIds) } : {}),
  });
}

// ****************************************************************************
// Reducers
// ****************************************************************************

reducers[ACTIONS.RESOLVE_URIS_START] = (state: State, action: any): State => {
  const { uris }: { uris: Array<string> } = action.data;

  const oldResolving = state.resolvingUris || [];
  const newResolving = oldResolving.slice();

  uris.forEach((uri) => {
    if (!newResolving.includes(uri)) {
      newResolving.push(uri);
    }
  });

  return Object.assign({}, state, {
    resolvingUris: newResolving,
  });
};

reducers[ACTIONS.SET_COST_INFOS_BY_ID] = (state: State, action: any): State => {
  const costInfos = action.data;
  const newCostInfosById = Object.assign({}, state.costInfosById);

  costInfos.forEach((costInfo) => {
    const { claimId, ...costData } = costInfo;
    newCostInfosById[claimId] = costData;
  });

  return { ...state, costInfosById: newCostInfosById };
};

reducers[ACTIONS.RESOLVE_URIS_SUCCESS] = (state: State, action: any): State => {
  return {
    ...handleClaimAction(state, action),
  };
};
reducers[ACTIONS.RESOLVE_URIS_FAIL] = (state: State, action: any): State => {
  const uris: Array<string> = action.data;

  const newResolvingUris = new Set(state.resolvingUris);
  uris.forEach((uri) => newResolvingUris.delete(uri));

  return { ...state, resolvingUris: Array.from(newResolvingUris) };
};

reducers[ACTIONS.FETCH_CLAIM_LIST_MINE_STARTED] = (state: State): State =>
  Object.assign({}, state, {
    isFetchingClaimListMine: true,
  });

reducers[ACTIONS.FETCH_CLAIM_LIST_MINE_COMPLETED] = (state: State, action: any): State => {
  const { result, setNewPageItems }: { result: ClaimListResponse, setNewPageItems?: boolean } = action.data;
  const claims = result.items;
  const page = result.page;
  const totalItems = result.total_items;

  const byIdDelta = {};
  const byUriDelta = {};
  const pendingByIdDelta = {};

  const myClaimIds = new Set(state.myClaims);
  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  let newMyCollectionClaimIds = state.myCollectionClaimIds && new Set(state.myCollectionClaimIds);
  let urlsForCurrentPage = [];

  claims.forEach((claim: Claim) => {
    const {
      permanent_url: permanentUri,
      claim_id: claimId,
      canonical_url: canonicalUri,
      value_type: valueType,
    } = claim;
    if (claim.type && claim.type.match(/claim|update/)) {
      urlsForCurrentPage.push(permanentUri);
      const includesMeta = Object.keys(claim.meta || {}).length > 0;

      if (claim.confirmations < 1) {
        pendingByIdDelta[claimId] = claim;

        if (state.byId[claimId]) {
          byIdDelta[claimId] = mergeClaim(claim, state.byId[claimId]);
        } else {
          byIdDelta[claimId] = claim;
        }
      } else if (includesMeta) {
        updateIfClaimChanged(state.byId, byIdDelta, claimId, claim);
      } else {
        updateIfValueEmpty(state.byId, byIdDelta, claimId, claim);
      }

      if (includesMeta) {
        updateIfValueChanged(state.claimsByUri, byUriDelta, permanentUri, claimId);
        updateIfValueChanged(state.claimsByUri, byUriDelta, canonicalUri, claimId);
      } else {
        updateIfValueEmpty(state.claimsByUri, byUriDelta, permanentUri, claimId);
        if (canonicalUri) updateIfValueEmpty(state.claimsByUri, byUriDelta, canonicalUri, claimId);
      }

      myClaimIds.add(claimId);

      if (valueType === 'collection' && (!newMyCollectionClaimIds || !newMyCollectionClaimIds.has(claimId))) {
        // $FlowFixMe
        newResolvedCollectionsById[claimId] = claimToStoredCollection(claim);

        if (!newMyCollectionClaimIds) newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
        newMyCollectionClaimIds.add(claimId);
      }
    }
  });

  return Object.assign({}, state, {
    isFetchingClaimListMine: false,
    myClaims: Array.from(myClaimIds),
    resolvedCollectionsById: newResolvedCollectionsById,
    myCollectionClaimIds: newMyCollectionClaimIds && Array.from(newMyCollectionClaimIds),
    byId: resolveDelta(state.byId, byIdDelta),
    pendingById: resolveDelta(state.pendingById, pendingByIdDelta),
    claimsByUri: resolveDelta(state.claimsByUri, byUriDelta),
    ...(setNewPageItems
      ? { myClaimsPageResults: urlsForCurrentPage, myClaimsPageNumber: page, myClaimsPageTotalResults: totalItems }
      : {}),
  });
};

reducers[ACTIONS.FETCH_CHANNEL_LIST_STARTED] = (state: State): State =>
  Object.assign({}, state, { fetchingMyChannels: true });

reducers[ACTIONS.FETCH_CHANNEL_LIST_COMPLETED] = (state: State, action: any): State => {
  const { claims }: { claims: Array<ChannelClaim> } = action.data;
  let myClaimIds = new Set(state.myClaims);
  const pendingByIdDelta = {};
  let newMyChannelClaimsById;
  const byIdDelta = {};
  const byUriDelta = {};
  const channelClaimCounts = Object.assign({}, state.channelClaimCounts);

  if (!claims.length) {
    // $FlowFixMe
    newMyChannelClaimsById = null;
  } else {
    newMyChannelClaimsById = Object.assign({}, state.myChannelClaimsById);
    claims.forEach((claim) => {
      const { meta } = claim;
      const { claims_in_channel: claimsInChannel } = meta;
      const { canonical_url: canonicalUrl, permanent_url: permanentUrl, claim_id: claimId, confirmations } = claim;

      updateIfValueChanged(state.claimsByUri, byUriDelta, canonicalUrl, claimId);
      updateIfValueChanged(state.claimsByUri, byUriDelta, permanentUrl, claimId);
      channelClaimCounts[canonicalUrl] = claimsInChannel;
      channelClaimCounts[permanentUrl] = claimsInChannel;

      // $FlowFixMe
      newMyChannelClaimsById[claimId] = claim;

      if (confirmations < 1) {
        pendingByIdDelta[claimId] = claim;

        if (state.byId[claimId]) {
          byIdDelta[claimId] = mergeClaim(claim, state.byId[claimId]);
        } else {
          byIdDelta[claimId] = claim;
        }
      } else {
        updateIfClaimChanged(state.byId, byIdDelta, claimId, claim);
      }

      myClaimIds.add(claimId);
    });
  }

  return Object.assign({}, state, {
    byId: resolveDelta(state.byId, byIdDelta),
    pendingById: resolveDelta(state.pendingById, pendingByIdDelta),
    claimsByUri: resolveDelta(state.claimsByUri, byUriDelta),
    channelClaimCounts,
    fetchingMyChannels: false,
    myChannelClaimsById: newMyChannelClaimsById,
    myClaims: myClaimIds ? Array.from(myClaimIds) : null,
  });
};

reducers[ACTIONS.FETCH_CHANNEL_LIST_FAILED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    fetchingMyChannels: false,
  });
};

reducers[ACTIONS.FETCH_CHANNEL_CLAIMS_STARTED] = (state: State, action: any): State => {
  const { uri, page } = action.data;
  const fetchingChannelClaims = Object.assign({}, state.fetchingChannelClaims);

  fetchingChannelClaims[uri] = page;

  return Object.assign({}, state, {
    fetchingChannelClaims,
    currentChannelPage: page,
  });
};

reducers[ACTIONS.FETCH_CHANNEL_CLAIMS_COMPLETED] = (state: State, action: any): State => {
  const {
    uri,
    claims,
    claimsInChannel,
    page,
    totalPages,
  }: {
    uri: string,
    claims: Array<StreamClaim>,
    claimsInChannel?: number,
    page: number,
    totalPages: number,
  } = action.data;

  // byChannel keeps claim_search relevant results by page. If the total changes, erase it.
  const channelClaimCounts = Object.assign({}, state.channelClaimCounts);

  const paginatedClaimsByChannel = Object.assign({}, state.paginatedClaimsByChannel);
  // check if count has changed - that means cached pagination will be wrong, so clear it
  const previousCount = paginatedClaimsByChannel[uri] && paginatedClaimsByChannel[uri]['itemCount'];
  const byChannel = claimsInChannel === previousCount ? Object.assign({}, paginatedClaimsByChannel[uri]) : {};
  const allClaimIds = new Set(byChannel.all);
  const currentPageClaimIds = [];
  const byIdDelta = {};
  const fetchingChannelClaims = Object.assign({}, state.fetchingChannelClaims);
  const claimsByUriDelta = {};

  if (claims !== undefined) {
    claims.forEach((claim) => {
      allClaimIds.add(claim.claim_id);
      currentPageClaimIds.push(claim.claim_id);
      updateIfClaimChanged(state.byId, byIdDelta, claim.claim_id, claim);
      updateIfValueChanged(state.claimsByUri, claimsByUriDelta, claim.canonical_url, claim.claim_id);
    });
  }

  byChannel.all = allClaimIds;
  byChannel.pageCount = totalPages;
  byChannel.itemCount = claimsInChannel;
  byChannel[page] = currentPageClaimIds;
  paginatedClaimsByChannel[uri] = byChannel;
  delete fetchingChannelClaims[uri];

  return Object.assign({}, state, {
    paginatedClaimsByChannel,
    byId: resolveDelta(state.byId, byIdDelta),
    fetchingChannelClaims,
    claimsByUri: resolveDelta(state.claimsByUri, claimsByUriDelta),
    channelClaimCounts,
    currentChannelPage: page,
  });
};

reducers[ACTIONS.ABANDON_CLAIM_STARTED] = (state: State, action: any): State => {
  const { claimId }: { claimId: string } = action.data;
  const abandoningById = Object.assign({}, state.abandoningById);

  abandoningById[claimId] = true;

  return Object.assign({}, state, {
    abandoningById,
  });
};

reducers[ACTIONS.UPDATE_PENDING_CLAIMS] = (state: State, action: any): State => {
  const { claims: pendingClaims }: { claims: Array<Claim> } = action.data;
  const byIdDelta = {};
  const pendingById = Object.assign({}, state.pendingById);
  const byUriDelta = {};
  let myClaimIds = new Set(state.myClaims);
  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  let newMyCollectionClaimIds = state.myCollectionClaimIds && new Set(state.myCollectionClaimIds);
  const newMyChannelClaimsById = Object.assign({}, state.myChannelClaimsById);

  // $FlowFixMe
  pendingClaims.forEach((claim: Claim) => {
    let newClaim;
    const { permanent_url: uri, claim_id: claimId, type, value_type: valueType } = claim;
    pendingById[claimId] = claim; // make sure we don't need to merge?
    const oldClaim = state.byId[claimId];
    if (oldClaim && oldClaim.canonical_url) {
      newClaim = mergeClaim(oldClaim, claim);
    } else {
      newClaim = claim;
    }
    if (valueType === 'channel') {
      // $FlowFixMe
      const channelClaim: ChannelClaim = claim;
      newMyChannelClaimsById[claimId] = channelClaim;
    } else if (valueType === 'collection') {
      // $FlowFixMe
      newResolvedCollectionsById[claimId] = claimToStoredCollection(claim);

      if (!newMyCollectionClaimIds) newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
      newMyCollectionClaimIds.add(claimId);
    }

    if (type && type.match(/claim|update/)) {
      updateIfClaimChanged(state.byId, byIdDelta, claimId, newClaim);
      updateIfValueChanged(state.claimsByUri, byUriDelta, uri, claimId);
    }
    myClaimIds.add(claimId);
  });
  return Object.assign({}, state, {
    myClaims: Array.from(myClaimIds),
    resolvedCollectionsById: newResolvedCollectionsById,
    myCollectionClaimIds: newMyCollectionClaimIds && Array.from(newMyCollectionClaimIds),
    byId: resolveDelta(state.byId, byIdDelta),
    pendingById,
    myChannelClaimsById: newMyChannelClaimsById,
    claimsByUri: resolveDelta(state.claimsByUri, byUriDelta),
  });
};

reducers[ACTIONS.UPDATE_CONFIRMED_CLAIMS] = (state: State, action: any): State => {
  const {
    claims: confirmedClaims,
    pending: pendingClaims,
  }: { claims: Array<Claim>, pending: { [string]: Claim } } = action.data;
  const byIdDelta = {};

  confirmedClaims.forEach((claim: GenericClaim) => {
    const { claim_id: claimId, type } = claim;
    let newClaim = claim;
    const oldClaim = state.byId[claimId];
    if (oldClaim && oldClaim.canonical_url) {
      newClaim = mergeClaim(oldClaim, claim);
    }
    if (type && type.match(/claim|update|channel/)) {
      updateIfClaimChanged(state.byId, byIdDelta, claimId, newClaim);
    }
  });

  return Object.assign({}, state, {
    pendingById: pendingClaims,
    byId: resolveDelta(state.byId, byIdDelta),
  });
};

reducers[ACTIONS.ABANDON_CLAIM_SUCCEEDED] = (state: State, action: any): State => {
  const { claimId }: { claimId: string } = action.data;
  const byId = Object.assign({}, state.byId);
  const newMyClaims = state.myClaims ? state.myClaims.slice() : [];
  let myClaimsPageResults = null;
  const newMyChannelClaimsById = Object.assign({}, state.myChannelClaimsById);
  const claimsByUri = Object.assign({}, state.claimsByUri);
  const abandoningById = Object.assign({}, state.abandoningById);
  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  let newMyCollectionClaimIds = state.myCollectionClaimIds && new Set(state.myCollectionClaimIds);

  let abandonedUris = [];

  Object.keys(claimsByUri).forEach((uri) => {
    if (claimsByUri[uri] === claimId) {
      abandonedUris.push(uri);
      delete claimsByUri[uri];
    }
  });

  if (abandonedUris.length > 0 && state.myClaimsPageResults) {
    myClaimsPageResults = state.myClaimsPageResults.filter((uri) => !abandonedUris.includes(uri));
  }

  if (abandoningById[claimId]) {
    delete abandoningById[claimId];
  }

  if (newMyChannelClaimsById[claimId]) {
    delete newMyChannelClaimsById[claimId];
  }

  const myClaims = newMyClaims.filter((i) => i !== claimId);

  if (newMyCollectionClaimIds) {
    newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
    if (newMyCollectionClaimIds.has(claimId)) newMyCollectionClaimIds.delete(claimId);
  }

  if (newResolvedCollectionsById[claimId]) {
    delete newResolvedCollectionsById[claimId];
  }

  delete byId[claimId];

  return Object.assign({}, state, {
    myClaims,
    myChannelClaimsById: newMyChannelClaimsById,
    resolvedCollectionsById: newResolvedCollectionsById,
    myCollectionClaimIds: newMyCollectionClaimIds && Array.from(newMyCollectionClaimIds),
    byId,
    claimsByUri,
    abandoningById,
    myClaimsPageResults: myClaimsPageResults || state.myClaimsPageResults,
  });
};

reducers[ACTIONS.CLEAR_CHANNEL_ERRORS] = (state: State): State => ({
  ...state,
  createChannelError: null,
  updateChannelError: null,
});

reducers[ACTIONS.CREATE_CHANNEL_STARTED] = (state: State): State => ({
  ...state,
  creatingChannel: true,
  createChannelError: null,
});

reducers[ACTIONS.CREATE_CHANNEL_COMPLETED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    creatingChannel: false,
  });
};

reducers[ACTIONS.CREATE_CHANNEL_FAILED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    creatingChannel: false,
    createChannelError: action.data,
  });
};

reducers[ACTIONS.UPDATE_CHANNEL_STARTED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    updateChannelError: '',
    updatingChannel: true,
  });
};

reducers[ACTIONS.UPDATE_CHANNEL_COMPLETED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    updateChannelError: '',
    updatingChannel: false,
  });
};

reducers[ACTIONS.UPDATE_CHANNEL_FAILED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    updateChannelError: action.data.message,
    updatingChannel: false,
  });
};

reducers[ACTIONS.IMPORT_CHANNEL_STARTED] = (state: State): State =>
  Object.assign({}, state, { pendingChannelImports: true });

reducers[ACTIONS.IMPORT_CHANNEL_COMPLETED] = (state: State): State =>
  Object.assign({}, state, { pendingChannelImports: false });

reducers[ACTIONS.CLEAR_CLAIM_SEARCH_HISTORY] = (state: State): State => {
  return {
    ...state,
    claimSearchByQuery: {},
    claimSearchByQueryLastPageReached: {},
  };
};

reducers[ACTIONS.CLAIM_SEARCH_STARTED] = (state: State, action: any): State => {
  const { query } = action.data;
  const fetchingClaimSearchByQuery = Object.assign({}, state.fetchingClaimSearchByQuery);
  const newResolvingIds = new Set(state.resolvingIds);
  fetchingClaimSearchByQuery[query] = true;

  const { claim_ids: claimIds } = JSON.parse(query);
  if (claimIds?.length > 0) claimIds.forEach((claimId) => newResolvingIds.add(claimId));

  return { ...state, fetchingClaimSearchByQuery, resolvingIds: Array.from(newResolvingIds) };
};

reducers[ACTIONS.CLAIM_SEARCH_COMPLETED] = (state: State, action: any): State => {
  const fetchingClaimSearchByQuery = Object.assign({}, state.fetchingClaimSearchByQuery);
  const claimSearchByQuery = Object.assign({}, state.claimSearchByQuery);
  const claimSearchByQueryLastPageReached = Object.assign({}, state.claimSearchByQueryLastPageReached);
  const newResolvingIds = new Set(state.resolvingIds);
  const { append, query, urls, pageSize } = action.data;

  if (append) {
    // todo: check for duplicate urls when concatenating?
    claimSearchByQuery[query] =
      claimSearchByQuery[query] && claimSearchByQuery[query].length ? claimSearchByQuery[query].concat(urls) : urls;
  } else {
    claimSearchByQuery[query] = urls;
  }

  // the returned number of urls is less than the page size, so we're on the last page
  claimSearchByQueryLastPageReached[query] = urls.length < pageSize;

  delete fetchingClaimSearchByQuery[query];

  const { claim_ids: claimIds } = JSON.parse(query);
  if (claimIds?.length > 0) claimIds.forEach((claimId) => newResolvingIds.delete(claimId));

  return Object.assign({}, state, {
    ...handleClaimAction(state, action),
    claimSearchByQuery,
    claimSearchByQueryLastPageReached,
    fetchingClaimSearchByQuery,
    resolvingIds: Array.from(newResolvingIds),
  });
};

reducers[ACTIONS.CLAIM_SEARCH_FAILED] = (state: State, action: any): State => {
  const { query } = action.data;
  const claimSearchByQuery = Object.assign({}, state.claimSearchByQuery);
  const fetchingClaimSearchByQuery = Object.assign({}, state.fetchingClaimSearchByQuery);
  const claimSearchByQueryLastPageReached = Object.assign({}, state.claimSearchByQueryLastPageReached);
  const newResolvingIds = new Set(state.resolvingIds);

  delete fetchingClaimSearchByQuery[query];

  if (claimSearchByQuery[query] && claimSearchByQuery[query].length !== 0) {
    claimSearchByQueryLastPageReached[query] = true;
  } else {
    claimSearchByQuery[query] = null;
  }

  const { claim_ids: claimIds } = JSON.parse(query);
  if (claimIds?.length > 0) claimIds.forEach((claimId) => newResolvingIds.delete(claimId));

  return Object.assign({}, state, {
    fetchingClaimSearchByQuery,
    claimSearchByQuery,
    claimSearchByQueryLastPageReached,
    resolvingIds: Array.from(newResolvingIds),
  });
};

reducers[ACTIONS.CLAIM_REPOST_STARTED] = (state: State): State => {
  return {
    ...state,
    repostLoading: true,
    repostError: null,
  };
};
reducers[ACTIONS.CLAIM_REPOST_COMPLETED] = (state: State, action: any): State => {
  const { originalClaimId, repostClaim } = action.data;
  const byId = { ...state.byId };
  const claimsByUri = { ...state.claimsByUri };
  const claimThatWasReposted = byId[originalClaimId];

  const repostStub = { ...repostClaim, reposted_claim: claimThatWasReposted };
  byId[repostStub.claim_id] = repostStub;
  claimsByUri[repostStub.permanent_url] = repostStub.claim_id;

  return {
    ...state,
    byId,
    claimsByUri,
    repostLoading: false,
    repostError: null,
  };
};
reducers[ACTIONS.CLAIM_REPOST_FAILED] = (state: State, action: any): State => {
  const { error } = action.data;

  return {
    ...state,
    repostLoading: false,
    repostError: error,
  };
};
reducers[ACTIONS.CLEAR_REPOST_ERROR] = (state: State): State => {
  return {
    ...state,
    repostError: null,
  };
};
reducers[ACTIONS.ADD_FILES_REFLECTING] = (state: State, action): State => {
  const pendingClaim = action.data;
  const { reflectingById } = state;
  const claimId = pendingClaim && pendingClaim.claim_id;

  reflectingById[claimId] = { fileListItem: pendingClaim, progress: 0, stalled: false };

  return Object.assign({}, state, {
    ...state,
    reflectingById: reflectingById,
  });
};
reducers[ACTIONS.UPDATE_FILES_REFLECTING] = (state: State, action): State => {
  const newReflectingById = action.data;

  return Object.assign({}, state, {
    ...state,
    reflectingById: newReflectingById,
  });
};
reducers[ACTIONS.TOGGLE_CHECKING_REFLECTING] = (state: State, action): State => {
  const checkingReflecting = action.data;

  return Object.assign({}, state, {
    ...state,
    checkingReflecting,
  });
};
reducers[ACTIONS.TOGGLE_CHECKING_PENDING] = (state: State, action): State => {
  const checking = action.data;

  return Object.assign({}, state, {
    ...state,
    checkingPending: checking,
  });
};

reducers[ACTIONS.PURCHASE_LIST_STARTED] = (state: State): State => {
  return {
    ...state,
    fetchingMyPurchases: true,
    fetchingMyPurchasesError: null,
  };
};

reducers[ACTIONS.FETCH_LATEST_FOR_CHANNEL_DONE] = (state: State, action: any): State => {
  const { uri, results } = action.data;
  const latestByUri = Object.assign({}, state.latestByUri);
  latestByUri[uri] = results;

  return Object.assign({}, state, {
    ...state,
    latestByUri,
  });
};

reducers[ACTIONS.PURCHASE_LIST_COMPLETED] = (state: State, action: any): State => {
  const { result }: { result: PurchaseListResponse, resolve: boolean } = action.data;
  const page = result.page;
  const totalItems = result.total_items;

  let byIdDelta = {};
  let byUriDelta = {};
  let urlsForCurrentPage = [];

  result.items.forEach((item) => {
    if (!item.claim) {
      // Abandoned claim
      return;
    }

    const { claim, ...purchaseInfo } = item;
    claim.purchase_receipt = purchaseInfo;
    const claimId = claim.claim_id;
    const uri = claim.canonical_url;

    updateIfClaimChanged(state.byId, byIdDelta, claimId, claim);
    updateIfValueChanged(state.claimsByUri, byUriDelta, uri, claimId);
    urlsForCurrentPage.push(uri);
  });

  return Object.assign({}, state, {
    byId: resolveDelta(state.byId, byIdDelta),
    claimsByUri: resolveDelta(state.claimsByUri, byUriDelta),
    myPurchases: urlsForCurrentPage,
    myPurchasesPageNumber: page,
    myPurchasesPageTotalResults: totalItems,
    fetchingMyPurchases: false,
  });
};

reducers[ACTIONS.PURCHASE_LIST_FAILED] = (state: State, action: any): State => {
  const { error } = action.data;

  return {
    ...state,
    fetchingMyPurchases: false,
    fetchingMyPurchasesError: error,
  };
};

reducers[ACTIONS.PURCHASE_URI_COMPLETED] = (state: State, action: any): State => {
  const { uri, purchaseReceipt } = action.data;

  let byId = Object.assign({}, state.byId);
  let byUri = Object.assign({}, state.claimsByUri);
  let myPurchases = state.myPurchases ? state.myPurchases.slice() : [];

  const claimId = byUri[uri];
  if (claimId) {
    let claim = byId[claimId];
    claim.purchase_receipt = purchaseReceipt;
  }

  myPurchases.push(uri);

  return {
    ...state,
    byId,
    myPurchases,
    purchaseUriSuccess: true,
  };
};

reducers[ACTIONS.PURCHASE_URI_FAILED] = (state: State): State => {
  return {
    ...state,
    purchaseUriSuccess: false,
  };
};

reducers[ACTIONS.CLEAR_PURCHASED_URI_SUCCESS] = (state: State): State => {
  return {
    ...state,
    purchaseUriSuccess: false,
  };
};

export function claimsReducer(state: State = defaultState, action: any) {
  const handler = reducers[action.type];
  if (handler) return handler(state, action);
  return state;
}

reducers[ACTIONS.CHECK_IF_PURCHASED_STARTED] = (state: State): State => {
  return {
    ...state,
    fetchingMyPurchasedClaims: true,
  };
};

reducers[ACTIONS.CHECK_IF_PURCHASED_FAILED] = (state: State, action: any): State => {
  return Object.assign({}, state, {
    fetchingMyPurchasedClaims: false,
    fetchingMyPurchasedClaimsError: action.data,
  });
};

reducers[ACTIONS.CHECK_IF_PURCHASED_COMPLETED] = (state: State, action: any): State => {
  const myPurchasedClaims = state.myPurchasedClaims.slice();
  const purchases: Array<any> = action.data || [];

  purchases.forEach((p) => {
    const index = myPurchasedClaims.findIndex((x) => x.id === p.id);
    if (index > -1) {
      // Replace existing, since it seems like the data could be updated (contains `updated_at` field).
      myPurchasedClaims.splice(index, 1, p);
    } else {
      myPurchasedClaims.push(p);
    }
  });

  return {
    ...state,
    myPurchasedClaims,
    fetchingMyPurchasedClaims: false,
  };
};

// --- Collection Claims ---

reducers[ACTIONS.COLLECTION_CLAIM_ITEMS_RESOLVE_COMPLETE] = (state: State, action: any) => {
  const resolvedCollectionObj: Collection = action.data;

  const { id: collectionId } = resolvedCollectionObj;

  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  const currentCollectionStore = newResolvedCollectionsById[collectionId];

  newResolvedCollectionsById[collectionId] = { ...currentCollectionStore, ...resolvedCollectionObj };

  return { ...state, resolvedCollectionsById: newResolvedCollectionsById };
};

reducers[ACTIONS.DELETE_ID_FROM_LOCAL_COLLECTIONS] = (state: State, action: any): State => {
  const collectionId = action.data;

  const newResolvedCollectionsById = Object.assign({}, state.resolvedCollectionsById);
  if (newResolvedCollectionsById[collectionId]) delete newResolvedCollectionsById[collectionId];

  let newMyCollectionClaimIds = state.myCollectionClaimIds && new Set(state.myCollectionClaimIds);
  if (newMyCollectionClaimIds) {
    newMyCollectionClaimIds = new Set(newMyCollectionClaimIds);
    newMyCollectionClaimIds.delete(collectionId);
  }

  return {
    ...state,
    resolvedCollectionsById: newResolvedCollectionsById,
    myCollectionClaimIds: newMyCollectionClaimIds && Array.from(newMyCollectionClaimIds),
  };
};
