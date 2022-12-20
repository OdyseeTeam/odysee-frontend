// @flow
import moment from 'moment';

import { CHANNEL_CREATION_LIMIT } from 'config';
import { normalizeURI, parseURI, isURIValid, buildURI } from 'util/lbryURI';
import { selectGeoBlockLists } from 'redux/selectors/blocked';
import { selectUserLocale, selectYoutubeChannels } from 'redux/selectors/user';
import { selectSupportsByOutpoint } from 'redux/selectors/wallet';
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { ODYSEE_CHANNEL } from 'constants/channels';
import {
  isClaimNsfw,
  filterClaims,
  getChannelIdFromClaim,
  isStreamPlaceholderClaim,
  getThumbnailFromClaim,
  getClaimRepostedAmount,
  getNameFromClaim,
  getChannelFromClaim,
  getChannelTitleFromClaim,
  getChannelNameFromClaim,
  getChannelPermanentUrlFromClaim,
} from 'util/claim';
import * as CLAIM from 'constants/claim';
import { INTERNAL_TAGS, MEMBERS_ONLY_CONTENT_TAG, RESTRICTED_CHAT_COMMENTS_TAG } from 'constants/tags';
import { getGeoRestrictionForClaim } from 'util/geoRestriction';
import { parsePurchaseTag, parseRentalTag } from 'util/stripe';
import { removeInternalStringTags } from 'util/tags';

type State = { claims: any, user: UserState };

const selectState = (state: State) => state.claims || {};

export const selectById = (state: State) => selectState(state).byId || {};
export const selectPendingClaimsById = (state: State) => selectState(state).pendingById || {};

export const selectClaimsById = (state: State) => {
  const byId = selectById(state);
  const pendingById = selectPendingClaimsById(state);
  return Object.assign(byId, pendingById); // do I need merged to keep metadata?
};

export const selectClaimIdsByUri = (state: State) => selectState(state).claimsByUri || {};
export const selectCurrentChannelPage = (state: State) => selectState(state).currentChannelPage || 1;
export const selectCreatingChannel = (state: State) => selectState(state).creatingChannel;
export const selectCreateChannelError = (state: State) => selectState(state).createChannelError;
export const selectRepostLoading = (state: State) => selectState(state).repostLoading;
export const selectRepostError = (state: State) => selectState(state).repostError;
export const selectLatestByUri = (state: State) => selectState(state).latestByUri;
export const selectResolvedCollectionsById = (state: State) => selectState(state).resolvedCollectionsById;
export const selectMyCollectionClaimIds = (state: State) => selectState(state).myCollectionClaimIds;
export const selectCostInfosById = (state: State) => selectState(state).costInfosById;

export const selectMyCollectionClaimsById = createSelector(
  selectResolvedCollectionsById,
  selectMyCollectionClaimIds,
  (resolvedCollectionsById, myCollectionClaimIds) => {
    if (!myCollectionClaimIds) return myCollectionClaimIds;

    const myCollectionClaimsById = {};

    myCollectionClaimIds.forEach((collectionId) => {
      if (resolvedCollectionsById[collectionId]) {
        myCollectionClaimsById[collectionId] = resolvedCollectionsById[collectionId];
      }
    });

    return myCollectionClaimsById;
  }
);

export const selectLatestClaimForUri = createSelector(
  (state, uri) => uri,
  selectLatestByUri,
  (uri, latestByUri) => {
    const latestClaim = latestByUri[uri];
    if (!latestClaim) return latestClaim;

    const latestClaims = Object.values(latestClaim);
    if (!latestClaims.length) return null;

    // $FlowFixMe
    return latestClaims[0].stream;
  }
);

export const selectClaimsByUri = createSelector(selectClaimIdsByUri, selectClaimsById, (byUri, byId) => {
  const claims = {};

  Object.keys(byUri).forEach((uri) => {
    const claimId = byUri[uri];

    // NOTE returning a null claim allows us to differentiate between an
    // undefined (never fetched claim) and one which just doesn't exist. Not
    // the cleanest solution but couldn't think of anything better right now
    if (claimId === null) {
      claims[uri] = null;
    } else {
      claims[uri] = byId[claimId];
    }
  });

  return claims;
});

/**
 * Returns the claim with the specified ID. The claim could be undefined if does
 * not exist or have not fetched. Take note of the second parameter, which means
 * an inline function or helper would be required when used as an input to
 * 'createSelector'.
 *
 * @param state
 * @param claimId
 * @returns {*}
 */
export const selectClaimForId = (state: State, claimId: string) => {
  const byId = selectClaimsById(state);
  return byId[claimId];
};

export const selectClaimUriForId = (state: State, claimId: string) => {
  const claim = selectClaimForId(state, claimId);
  return claim && (claim.canonical_url || claim.permanent_url);
};

export const selectChannelPermanentUriForUri = (state: State, uri: string) =>
  getChannelPermanentUrlFromClaim(selectClaimForUri(state, uri));

export const selectAllClaimsByChannel = createSelector(selectState, (state) => state.paginatedClaimsByChannel || {});

export const selectPendingIds = createSelector(selectState, (state) => Object.keys(state.pendingById) || []);

export const selectPendingClaims = createSelector(selectPendingClaimsById, (pendingById) => Object.values(pendingById));

export const selectClaimIsPendingForId = (state: State, claimId: string) => {
  return Boolean(selectPendingClaimsById(state)[claimId]);
};

export const makeSelectClaimIsPending = (uri: string) =>
  createSelector(selectClaimIdsByUri, selectPendingClaimsById, (idsByUri, pendingById) => {
    const claimId = idsByUri[normalizeURI(uri)];

    if (claimId) {
      return Boolean(pendingById[claimId]);
    }
    return false;
  });

export const makeSelectClaimIdIsPending = (claimId: string) =>
  createSelector(selectPendingClaimsById, (pendingById) => {
    return Boolean(pendingById[claimId]);
  });

export const selectClaimIdForUri = (state: State, uri: string) => selectClaimIdsByUri(state)[uri];

export const selectReflectingById = (state: State) => selectState(state).reflectingById;

// OBSOLETE: use selectClaimForClaimId instead
export const makeSelectClaimForClaimId = (claimId: string) => createSelector(selectClaimsById, (byId) => byId[claimId]);

export const selectClaimForClaimId = (state: State, claimId: string) => selectClaimsById(state)[claimId];

export const selectClaimForUri = createCachedSelector(
  selectClaimIdsByUri,
  selectClaimsById,
  (state, uri) => uri,
  (state, uri, returnRepost = true) => returnRepost,
  (byUri, byId, uri, returnRepost) => {
    const validUri = isURIValid(uri, false);

    if (validUri && byUri) {
      const normalizedUri = normalizeURI(uri);
      const claimId = uri && byUri[normalizedUri];
      const claim = byId[claimId];

      // Make sure to return the claim as is so apps can check if it's been resolved before (null) or still needs to be resolved (undefined)
      if (claimId === null) {
        return null;
      } else if (claimId === undefined) {
        return undefined;
      }

      const repostedClaim = claim && claim.reposted_claim;
      if (repostedClaim && returnRepost) {
        const channelUrl =
          claim.signing_channel && (claim.signing_channel.canonical_url || claim.signing_channel.permanent_url);

        return {
          ...repostedClaim,
          repost_url: normalizedUri,
          repost_channel_url: channelUrl,
          repost_bid_amount: claim && claim.meta && claim.meta.effective_amount,
        };
      } else {
        return claim;
      }
    }
  }
)((state, uri, returnRepost = true) => `${String(uri)}:${returnRepost ? '1' : '0'}`);

export const selectClaimOutpointForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim;

  const outpoint = `${claim.txid}:${claim.nout}`;
  return outpoint;
};

export const selectChannelClaimIdForUri = (state: State, uri: string) =>
  getChannelIdFromClaim(selectClaimForUri(state, uri));
export const selectChannelNameForUri = (state: State, uri: string) =>
  getChannelNameFromClaim(selectClaimForUri(state, uri));

export const selectHasClaimForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim; // null/undefined here

  return Boolean(claim);
};
export const selectHasClaimForId = (state: State, id: ClaimId) => {
  const claim = selectClaimForId(state, id);
  if (!claim) return claim; // null/undefined here

  return Boolean(claim);
};

export const selectHasResolvedClaimForUri = (state: State, uri: string) => {
  // This selector assumes that `uri` is never null and is valid. It
  // cannot differentiate whether the undefined claim is due to being
  // unresolved or an invalid `uri`. Client beware.
  const claim = selectClaimForUri(state, uri);
  return claim !== undefined;
};

// Note: this is deprecated. Use "selectClaimForUri(state, uri)" instead.
export const makeSelectClaimForUri = (uri: string, returnRepost: boolean = true) =>
  createSelector(selectClaimIdsByUri, selectClaimsById, (byUri, byId) => {
    const validUri = isURIValid(uri, false);

    if (validUri && byUri) {
      const normalizedUri = normalizeURI(uri);
      const claimId = uri && byUri[normalizedUri];
      const claim = byId[claimId];

      // Make sure to return the claim as is so apps can check if it's been resolved before (null) or still needs to be resolved (undefined)
      if (claimId === null) {
        return null;
      } else if (claimId === undefined) {
        return undefined;
      }

      const repostedClaim = claim && claim.reposted_claim;
      if (repostedClaim && returnRepost) {
        const channelUrl =
          claim.signing_channel && (claim.signing_channel.canonical_url || claim.signing_channel.permanent_url);

        return {
          ...repostedClaim,
          repost_url: normalizedUri,
          repost_channel_url: channelUrl,
          repost_bid_amount: claim && claim.meta && claim.meta.effective_amount,
        };
      } else {
        return claim;
      }
    }
  });

// Returns your claim IDs without handling pending and abandoned claims.
export const selectMyClaimIdsRaw = (state: State) => selectState(state).myClaims;

export const selectMyClaimsRaw = createSelector(selectState, selectClaimsById, (state, byId) => {
  const ids = state.myClaims;
  if (!ids) {
    return ids;
  }

  const claims = [];
  ids.forEach((id) => {
    if (byId[id]) {
      // I'm not sure why this check is necessary, but it ought to be a quick fix for https://github.com/lbryio/lbry-desktop/issues/544
      claims.push(byId[id]);
    }
  });
  return claims;
});

export const selectAbandoningById = (state: State) => selectState(state).abandoningById || {};
export const selectAbandoningIds = createSelector(selectAbandoningById, (abandoningById) =>
  Object.keys(abandoningById)
);

export const makeSelectAbandoningClaimById = (claimId: string) =>
  createSelector(selectAbandoningIds, (ids) => ids.includes(claimId));

export const makeSelectIsAbandoningClaimForUri = (uri: string) =>
  createSelector(selectClaimIdsByUri, selectAbandoningIds, (claimIdsByUri, abandoningById) => {
    const claimId = claimIdsByUri[normalizeURI(uri)];
    return abandoningById.indexOf(claimId) >= 0;
  });

export const selectMyActiveClaims = createSelector(
  selectMyClaimIdsRaw,
  selectAbandoningIds,
  (myClaimIds, abandoningIds) => {
    return new Set(myClaimIds && myClaimIds.filter((claimId) => !abandoningIds.includes(claimId)));
  }
);

// Helper for 'selectClaimIsMineForUri'.
// Returns undefined string if unable to normalize or is not valid.
const selectNormalizedAndVerifiedUri = createCachedSelector(
  (state, rawUri) => rawUri,
  (rawUri) => {
    try {
      const uri = normalizeURI(rawUri);
      if (isURIValid(uri, false)) {
        return uri;
      }
    } catch (e) {}

    return undefined;
  }
)((state, rawUri) => String(rawUri));

export const selectClaimIsMine = (state: State, claim: ?Claim) => {
  if (!claim) return claim;

  if (claim.is_my_output) {
    return true;
  }

  const signingChannelId = getChannelIdFromClaim(claim);
  const myChannelIds = selectMyChannelClaimIds(state);

  if (signingChannelId && myChannelIds) {
    if (myChannelIds.includes(signingChannelId)) {
      return true;
    }
  } else {
    const myActiveClaims = selectMyActiveClaims(state);
    if (claim.claim_id && myActiveClaims.has(claim.claim_id)) {
      return true;
    }
  }
};

export const selectClaimIsMineForId = (state: State, claimId: string) =>
  selectClaimIsMine(state, selectClaimForClaimId(state, claimId));

export const selectClaimIsMineForUri = (state: State, rawUri: string) => {
  // Not memoizing this selector because:
  // (1) The workload is somewhat lightweight.
  // (2) Since it depends on 'selectClaimsByUri', memoization won't work anyway
  // because the array is constantly invalidated.

  const uri = selectNormalizedAndVerifiedUri(state, rawUri);
  if (!uri) {
    return false;
  }

  const claimsByUri = selectClaimsByUri(state);
  return selectClaimIsMine(state, claimsByUri && claimsByUri[uri]);
};

export const selectMyPurchases = (state: State) => selectState(state).myPurchases;
export const selectPurchaseUriSuccess = (state: State) => selectState(state).purchaseUriSuccess;
export const selectMyPurchasesCount = (state: State) => selectState(state).myPurchasesPageTotalResults;
export const selectIsFetchingMyPurchases = (state: State) => selectState(state).fetchingMyPurchases;
export const selectFetchingMyPurchasesError = (state: State) => selectState(state).fetchingMyPurchasesError;

export const makeSelectMyPurchasesForPage = (query: ?string, page: number = 1) =>
  createSelector(
    selectMyPurchases,
    selectClaimsByUri,
    (myPurchases: Array<string>, claimsByUri: { [string]: Claim }) => {
      if (!myPurchases) {
        return undefined;
      }

      if (!query) {
        // ensure no duplicates from double purchase bugs
        // return [...new Set(myPurchases)];
        return Array.from(new Set(myPurchases));
      }

      const fileInfos = myPurchases.map((uri) => claimsByUri[uri]);
      const matchingFileInfos = filterClaims(fileInfos, query);
      const start = (Number(page) - 1) * Number(CLAIM.PAGE_SIZE);
      const end = Number(page) * Number(CLAIM.PAGE_SIZE);
      return matchingFileInfos && matchingFileInfos.length
        ? matchingFileInfos.slice(start, end).map((fileInfo) => fileInfo.canonical_url || fileInfo.permanent_url)
        : [];
    }
  );

export const selectClaimWasPurchasedForUri = createSelector(selectClaimForUri, (claim) =>
  Boolean(claim?.purchase_receipt !== undefined)
);

export const selectAllFetchingChannelClaims = createSelector(selectState, (state) => state.fetchingChannelClaims || {});

export const makeSelectFetchingChannelClaims = (uri: string) =>
  createSelector(selectAllFetchingChannelClaims, (fetching) => fetching && fetching[uri]);

export const makeSelectClaimsInChannelForPage = (uri: string, page?: number) =>
  createSelector(selectClaimsById, selectAllClaimsByChannel, (byId, allClaims) => {
    const byChannel = allClaims[uri] || {};
    const claimIds = byChannel[page || 1];

    if (!claimIds) return claimIds;

    return claimIds.map((claimId) => byId[claimId]);
  });

// THIS IS LEFT OVER FROM ONE TAB CHANNEL_CONTENT
export const makeSelectTotalClaimsInChannelSearch = (uri: string) =>
  createSelector(selectClaimsById, selectAllClaimsByChannel, (byId, allClaims) => {
    const byChannel = allClaims[uri] || {};
    return byChannel['itemCount'];
  });

// THIS IS LEFT OVER FROM ONE_TAB CHANNEL CONTENT
export const makeSelectTotalPagesInChannelSearch = (uri: string) =>
  createSelector(selectClaimsById, selectAllClaimsByChannel, (byId, allClaims) => {
    const byChannel = allClaims[uri] || {};
    return byChannel['pageCount'];
  });

export const selectIsLivestreamClaimForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return isStreamPlaceholderClaim(claim);
};

export const selectMetadataForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  const metadata = claim && claim.value;
  return metadata || (claim === undefined ? undefined : null);
};

export const selectMetadataForClaimId = (state: State, claimId: ClaimId) => {
  const claim = selectClaimForClaimId(state, claimId);
  if (!claim) return claim;

  const { value: metadata } = claim;
  return metadata;
};

export const selectMetadataItemForClaimIdAndKey = (
  state: State,
  claimId: ClaimId,
  key: ChannelMetadataKey | StreamMetadataKey | CollectionMetadataKey
) => selectMetadataForClaimId(state, claimId)[key];

export const selectTagNamesForClaimId = createSelector(
  (state, claimId) => selectMetadataItemForClaimIdAndKey(state, claimId, 'tags'),
  (tags) => tags && tags.map((tag) => tag.name || tag)
);

export const selectGenericClaimPublishUpdateMetadataForId = (state: State, claimId: ClaimId) => {
  const claim = selectClaimForClaimId(state, claimId);
  if (!claim) return claim;

  const thumbnail = selectMetadataItemForClaimIdAndKey(state, claimId, 'thumbnail');
  const tags = selectMetadataItemForClaimIdAndKey(state, claimId, 'tags');

  const genericUploadMetadata: GenericPublishCreateParams & GenericPublishUpdateParams = {
    claim_id: claim.claim_id,
    // $FlowFixMe
    name: getNameFromClaim(claim),
    channel_id: getChannelIdFromClaim(claim) || null,
    title: selectMetadataItemForClaimIdAndKey(state, claimId, 'title'),
    description: selectMetadataItemForClaimIdAndKey(state, claimId, 'description'),
    languages: selectMetadataItemForClaimIdAndKey(state, claimId, 'languages') || [],
    locations: selectMetadataItemForClaimIdAndKey(state, claimId, 'locations'),
    bid: Number(selectClaimBidAmountForId(state, claimId)) || 0.001,
    tags: tags ? tags.map((tag) => ({ name: tag })) : [],
    ...(thumbnail ? { thumbnail_url: thumbnail.url } : {}),
  };

  return genericUploadMetadata;
};

export const selectCollectionClaimPublishUpdateMetadataForId = (state: State, claimId: ClaimId) => {
  const claimMetadata = selectGenericClaimPublishUpdateMetadataForId(state, claimId);
  if (!claimMetadata) return claimMetadata;

  const collectionClaimIds = selectClaimForClaimId(state, claimId).value?.claims;
  if (!collectionClaimIds) return collectionClaimIds;

  // $FlowFixMe
  const collectionPublishUpdateMetadata: CollectionPublishUpdateParams = {
    ...claimMetadata,
    claims: collectionClaimIds,
  };

  return collectionPublishUpdateMetadata;
};

export const makeSelectMetadataForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    const metadata = claim && claim.value;
    return metadata || (claim === undefined ? undefined : null);
  });

export const makeSelectMetadataItemForUri = (uri: string, key: string) =>
  createSelector(makeSelectMetadataForUri(uri), (metadata: ChannelMetadata | StreamMetadata) => {
    if (metadata && metadata.tags && key === 'tags') {
      return metadata.tags ? metadata.tags.filter((tag) => !INTERNAL_TAGS.includes(tag)) : [];
    }
    return metadata ? metadata[key] : undefined;
  });

export const selectTitleForUri = (state: State, uri: string) => {
  const metadata = selectMetadataForUri(state, uri);
  return metadata && metadata.title;
};

export const selectReleaseTimeForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim;

  return claim?.value?.release_time;
};

export const selectMomentReleaseTimeForUri = createSelector(selectReleaseTimeForUri, (claimReleaseTime) => {
  const releaseTime: moment = moment.unix(claimReleaseTime || 0);
  return releaseTime;
});

export const selectClaimReleaseInFutureForUri = (state: State, uri: string) =>
  selectMomentReleaseTimeForUri(state, uri).isAfter();

export const selectClaimReleaseInPastForUri = (state: State, uri: string) =>
  selectMomentReleaseTimeForUri(state, uri).isBefore();

export const selectDateForUri = createCachedSelector(
  selectClaimForUri, // input: (state, uri, ?returnRepost)
  (claim) => {
    const timestamp =
      claim &&
      claim.value &&
      (claim.value.release_time
        ? claim.value.release_time * 1000
        : claim.meta && claim.meta.creation_timestamp
        ? claim.meta.creation_timestamp * 1000
        : null);
    if (!timestamp) {
      return undefined;
    }
    const dateObj = new Date(timestamp);
    return dateObj;
  }
)((state, uri) => String(uri));

export const makeSelectAmountForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    return claim && claim.amount;
  });

export const selectClaimBidAmountForId = (state: State, id: ClaimId) => {
  const claim = selectClaimForClaimId(state, id);
  return claim && claim.amount;
};

export const makeSelectEffectiveAmountForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri, false), (claim) => {
    return (
      claim && claim.meta && typeof claim.meta.effective_amount === 'string' && Number(claim.meta.effective_amount)
    );
  });

export const makeSelectContentTypeForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    const isLivestreamClaim = isStreamPlaceholderClaim(claim);
    if (isLivestreamClaim) return 'livestream';

    const source = claim && claim.value && claim.value.source;
    return source ? source.media_type : undefined;
  });

export const selectThumbnailForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return getThumbnailFromClaim(claim);
};

export const selectThumbnailForId = (state: State, claimId: string) => {
  const claim = selectClaimForId(state, claimId);
  return getThumbnailFromClaim(claim);
};

export const makeSelectCoverForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    if (claim && claim.value.cover) {
      const cover = claim && claim.value && claim.value.cover;
      return cover && cover.url ? cover.url.trim().replace(/^http:\/\//i, 'https://') : undefined;
    } else {
      const cover = claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.cover;
      return cover && cover.url ? cover.url.trim().replace(/^http:\/\//i, 'https://') : undefined;
    }
  });

export const makeSelectAvatarForUri = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    if (claim && claim.value.cover) {
      const avatar = claim && claim.value && claim.value.thumbnail && claim.value.thumbnail;
      return avatar && avatar.url ? avatar.url.trim().replace(/^http:\/\//i, 'https://') : undefined;
    } else {
      const avatar =
        claim &&
        claim.signing_channel &&
        claim.signing_channel.value &&
        claim.signing_channel.value.thumbnail &&
        claim.signing_channel.value.thumbnail;
      return avatar && avatar.url ? avatar.url.trim().replace(/^http:\/\//i, 'https://') : false;
    }
  });

export const selectIsFetchingClaimListMine = (state: State) => selectState(state).isFetchingClaimListMine;

export const selectMyClaimsPage = createSelector(selectState, (state) => state.myClaimsPageResults || []);

export const selectMyClaimsPageNumber = createSelector(
  selectState,
  (state) => (state.claimListMinePage && state.claimListMinePage.items) || [],

  (state) => (state.txoPage && state.txoPage.page) || 1
);

export const selectMyClaimsPageItemCount = (state: State) => selectState(state).myClaimsPageTotalResults || 1;
export const selectFetchingMyClaimsPageError = (state: State) => selectState(state).fetchingClaimListMinePageError;

export const selectMyClaims = createSelector(
  selectMyActiveClaims,
  selectClaimsById,
  selectAbandoningIds,
  (myClaimIds, byId, abandoningIds) => {
    const claims = [];

    myClaimIds.forEach((id) => {
      const claim = byId[id];

      if (claim && abandoningIds.indexOf(id) === -1) claims.push(claim);
    });

    return [...claims];
  }
);

export const selectMyClaimsWithoutChannels = createSelector(selectMyClaims, (myClaims) =>
  myClaims.filter((claim) => claim && !claim.name.match(/^@/)).sort((a, b) => a.timestamp - b.timestamp)
);

export const selectMyClaimUrisWithoutChannels = createSelector(selectMyClaimsWithoutChannels, (myClaims) => {
  return myClaims
    .sort((a, b) => {
      if (a.height < 1) {
        return -1;
      } else if (b.height < 1) {
        return 1;
      } else {
        return b.timestamp - a.timestamp;
      }
    })
    .map((claim) => {
      return claim.canonical_url || claim.permanent_url;
    });
});

export const selectAllMyClaimsByOutpoint = createSelector(
  selectMyClaimsRaw,
  (claims) => new Set(claims && claims.length ? claims.map((claim) => `${claim.txid}:${claim.nout}`) : null)
);

export const selectMyClaimsOutpoints = createSelector(selectMyClaims, (myClaims) => {
  const outpoints = [];

  myClaims.forEach((claim) => outpoints.push(`${claim.txid}:${claim.nout}`));

  return outpoints;
});

export const selectFetchingMyChannels = (state: State) => selectState(state).fetchingMyChannels;

export const selectMyChannelClaimsById = (state: State) => selectState(state).myChannelClaimsById;
export const selectMyChannelClaims = createSelector(
  selectMyChannelClaimsById,
  (myChannelClaimsById) => myChannelClaimsById && Object.values(myChannelClaimsById)
);
export const selectMyChannelClaimIds = createSelector(
  selectMyChannelClaimsById,
  (myChannelClaimsById) => myChannelClaimsById && Object.keys(myChannelClaimsById)
);
export const selectIsChannelMineForClaimId = (state: State, channelId: string) => {
  const myChannelClaimIds = selectMyChannelClaimIds(state);
  return Boolean(myChannelClaimIds && myChannelClaimIds.includes(channelId));
};

export const selectMyChannelClaimUrls = createSelector(
  selectMyChannelClaims,
  (myChannelClaims) => myChannelClaims && myChannelClaims.map(({ permanent_url }) => permanent_url)
);

export const selectHasChannels = (state: State) => {
  const myChannelClaimIds = selectMyChannelClaimIds(state);
  return myChannelClaimIds ? myChannelClaimIds.length > 0 : false;
};

export const selectResolvingUris = (state: State) => selectState(state).resolvingUris;
export const selectResolvingIds = (state: State) => selectState(state).resolvingIds;

export const selectChannelImportPending = (state: State) => selectState(state).pendingChannelImport;

export const selectIsUriResolving = (state: State, uri: string) => {
  const resolvingUris = selectResolvingUris(state);
  return resolvingUris && resolvingUris.includes(uri);
};

export const selectIsResolvingForId = (state: State, claimId: ClaimId) =>
  new Set(selectResolvingUris(state)).has(claimId);

export const selectChannelClaimCounts = createSelector(selectState, (state) => state.channelClaimCounts || {});

export const makeSelectPendingClaimForUri = (uri: string) =>
  createSelector(selectPendingClaimsById, (pendingById) => {
    let uriStreamName;
    let uriChannelName;
    try {
      ({ streamName: uriStreamName, channelName: uriChannelName } = parseURI(uri));
    } catch (e) {
      return null;
    }
    const pendingClaims = (Object.values(pendingById): any);
    const matchingClaim = pendingClaims.find((claim: GenericClaim) => {
      return claim.normalized_name === uriChannelName || claim.normalized_name === uriStreamName;
    });
    return matchingClaim || null;
  });

export const makeSelectTotalItemsForChannel = (uri: string) =>
  createSelector(selectChannelClaimCounts, (byUri) => byUri && byUri[normalizeURI(uri)]);

export const makeSelectTotalPagesForChannel = (uri: string, pageSize: number = 10) =>
  createSelector(
    selectChannelClaimCounts,
    (byUri) => byUri && byUri[uri] && Math.ceil(byUri[normalizeURI(uri)] / pageSize)
  );

export const makeSelectNsfwCountFromUris = (uris: Array<string>) =>
  createSelector(selectClaimsByUri, (claims) =>
    uris.reduce((acc, uri) => {
      const claim = claims[uri];
      if (claim && isClaimNsfw(claim)) {
        return acc + 1;
      }
      return acc;
    }, 0)
  );

export const makeSelectOmittedCountForChannel = (uri: string) =>
  createSelector(
    makeSelectTotalItemsForChannel(uri),
    makeSelectTotalClaimsInChannelSearch(uri),
    (claimsInChannel, claimsInSearch) => {
      if (claimsInChannel && typeof claimsInSearch === 'number' && claimsInSearch >= 0) {
        return claimsInChannel - claimsInSearch;
      } else return 0;
    }
  );

export const selectClaimIsNsfwForUri = createCachedSelector(
  selectClaimForUri,
  // Eventually these will come from some list of tags that are considered adult
  // Or possibly come from users settings of what tags they want to hide
  // For now, there is just a hard coded list of tags inside `isClaimNsfw`
  // selectNaughtyTags(),
  (claim: Claim) => {
    return claim ? isClaimNsfw(claim) : false;
  }
)((state, uri) => String(uri));

export const selectChannelForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return getChannelFromClaim(claim);
};
export const selectChannelTitleForUri = (state: State, uri: string) => {
  const channel = selectChannelForUri(state, uri);
  return getChannelTitleFromClaim(channel);
};

export const selectChannelNameForId = (state: State, claimId: string) => {
  const uri = selectClaimUriForId(state, claimId);
  return selectChannelForClaimUri(state, uri);
};

export const selectNameForClaimId = (state: State, claimId: ClaimId) =>
  getNameFromClaim(selectClaimForClaimId(state, claimId));

export const selectChannelForClaimUri = createCachedSelector(
  (state, uri, includePrefix) => includePrefix,
  selectClaimForUri,
  (includePrefix?: boolean, claim: Claim) => {
    if (!claim || !claim.signing_channel || !claim.is_channel_signature_valid) {
      return null;
    }

    const { canonical_url: canonicalUrl, permanent_url: permanentUrl } = claim.signing_channel;

    if (canonicalUrl) {
      return includePrefix ? canonicalUrl : canonicalUrl.slice('lbry://'.length);
    } else {
      return includePrefix ? permanentUrl : permanentUrl.slice('lbry://'.length);
    }
  }
)((state, uri, includePrefix) => `${String(uri)}:${String(includePrefix)}`);

export const selectChannelNameForClaimUri = (state: State, uri: string) => {
  const channel = selectChannelForClaimUri(state, uri);
  return getNameFromClaim(channel);
};

// Returns the associated channel uri for a given claim uri
// accepts a regular claim uri lbry://something
// returns the channel uri that created this claim lbry://@channel
export const makeSelectChannelForClaimUri = (uri: string, includePrefix: boolean = false) =>
  createSelector(makeSelectClaimForUri(uri), (claim: ?Claim) => {
    if (!claim || !claim.signing_channel || !claim.is_channel_signature_valid) {
      return null;
    }

    const { canonical_url: canonicalUrl, permanent_url: permanentUrl } = claim.signing_channel;

    if (canonicalUrl) {
      return includePrefix ? canonicalUrl : canonicalUrl.slice('lbry://'.length);
    } else {
      return includePrefix ? permanentUrl : permanentUrl.slice('lbry://'.length);
    }
  });

export const makeSelectChannelPermUrlForClaimUri = (uri: string, includePrefix: boolean = false) =>
  createSelector(makeSelectClaimForUri(uri), (claim: ?Claim) => {
    if (claim && claim.value_type === 'channel') {
      return claim.permanent_url;
    }
    if (!claim || !claim.signing_channel || !claim.is_channel_signature_valid) {
      return null;
    }
    return claim.signing_channel.permanent_url;
  });

export const makeSelectMyChannelPermUrlForName = (name: string) =>
  createSelector(selectMyChannelClaims, (claims) => {
    const matchingClaim = claims && claims.find((claim) => claim.name === name);
    return matchingClaim ? matchingClaim.permanent_url : null;
  });

// CAUTION: this is purely meant for the GUI now, as it filters out INTERNAL_TAGS.
export const selectTagsForUri = createCachedSelector(selectMetadataForUri, (metadata: ?GenericMetadata) => {
  return metadata && metadata.tags ? removeInternalStringTags(metadata.tags) : [];
})((state, uri) => String(uri));

export const selectPurchaseTagForUri = createCachedSelector(selectMetadataForUri, (metadata: ?GenericMetadata) => {
  return parsePurchaseTag(metadata?.tags);
})((state, uri) => String(uri));

export const selectPreorderTagForUri = createCachedSelector(selectMetadataForUri, (metadata: ?GenericMetadata) => {
  const matchingTag = metadata && metadata.tags && metadata.tags.find((tag) => tag.includes('preorder:'));
  if (matchingTag) return matchingTag.slice(9);
})((state, uri) => String(uri));

export const selectProtectedContentTagForUri = createSelector(
  selectMetadataForUri,
  (metadata: ?GenericMetadata) => metadata && new Set(metadata.tags).has(MEMBERS_ONLY_CONTENT_TAG)
);

export const selectedRestrictedCommentsChatTagForUri = createSelector(
  selectMetadataForUri,
  (metadata: ?GenericMetadata) => metadata && new Set(metadata.tags).has(RESTRICTED_CHAT_COMMENTS_TAG)
);

export const selectRentalTagForUri = createCachedSelector(selectMetadataForUri, (metadata: ?GenericMetadata) => {
  return parseRentalTag(metadata?.tags);
})((state, uri) => String(uri));

export const selectPreorderContentClaimIdForUri = createCachedSelector(
  selectMetadataForUri,
  (metadata: ?GenericMetadata) => {
    const matchingTag = metadata && metadata.tags && metadata.tags.find((tag) => tag.includes('full upload:'));
    if (matchingTag) return matchingTag.slice(12);
  }
)((state, uri) => String(uri));

export const selectFetchingClaimSearchByQuery = (state: State) => selectState(state).fetchingClaimSearchByQuery || {};
export const selectIsFetchingClaimSearchForQuery = (state: State, query: string) =>
  selectFetchingClaimSearchByQuery(state)[query] || false;

export const selectFetchingClaimSearch = createSelector(
  selectFetchingClaimSearchByQuery,
  (fetchingClaimSearchByQuery) => Boolean(Object.keys(fetchingClaimSearchByQuery).length)
);

export const selectClaimSearchByQuery = createSelector(selectState, (state) => state.claimSearchByQuery || {});

export const selectClaimSearchByQueryLastPageReached = createSelector(
  selectState,
  (state) => state.claimSearchByQueryLastPageReached || {}
);

export const selectShortUrlForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return claim && claim.short_url;
};

export const selectCanonicalUrlForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return claim && claim.canonical_url;
};

export const selectPermanentUrlForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return claim && claim.permanent_url;
};

export const makeSelectSupportsForUri = (uri: string) =>
  createSelector(selectSupportsByOutpoint, makeSelectClaimForUri(uri), (byOutpoint, claim: ?StreamClaim) => {
    if (!claim || !claim.is_my_output) {
      return null;
    }

    const { claim_id: claimId } = claim;
    let total = 0;

    Object.values(byOutpoint).forEach((support) => {
      // $FlowFixMe
      const { claim_id, amount } = support;
      total = claim_id === claimId && amount ? total + parseFloat(amount) : total;
    });

    return total;
  });

export const selectUpdatingChannel = (state: State) => selectState(state).updatingChannel;
export const selectUpdateChannelError = (state: State) => selectState(state).updateChannelError;

export const makeSelectReflectingClaimForUri = (uri: string) =>
  createSelector(selectClaimIdsByUri, selectReflectingById, (claimIdsByUri, reflectingById) => {
    const claimId = claimIdsByUri[normalizeURI(uri)];
    return reflectingById[claimId];
  });

export const makeSelectMyStreamUrlsForPage = (page: number = 1) =>
  createSelector(selectMyClaimUrisWithoutChannels, (urls) => {
    const start = (Number(page) - 1) * Number(CLAIM.PAGE_SIZE);
    const end = Number(page) * Number(CLAIM.PAGE_SIZE);

    return urls && urls.length ? urls.slice(start, end) : [];
  });

export const selectMyStreamUrlsCount = createSelector(selectMyClaimUrisWithoutChannels, (channels) => channels.length);

export const makeSelectTagInClaimOrChannelForUri = (uri: string, tag: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    const claimTags = (claim && claim.value && claim.value.tags) || [];
    const channelTags =
      (claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.tags) || [];
    return claimTags.includes(tag) || channelTags.includes(tag);
  });

export const makeSelectClaimHasSource = (uri: string) =>
  createSelector(makeSelectClaimForUri(uri), (claim) => {
    if (!claim) {
      return false;
    }

    return Boolean(claim.value.source);
  });

export const selectIsStreamPlaceholderForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  return isStreamPlaceholderClaim(claim);
};

export const selectTotalStakedAmountForUri = createCachedSelector(selectClaimForUri, (claim) => {
  if (!claim || !claim.amount || !claim.meta || !claim.meta.support_amount) {
    return 0;
  }

  return parseFloat(claim.amount) + parseFloat(claim.meta.support_amount) || 0;
})((state, uri) => String(uri));

export const selectStakedLevelForChannelUri = createCachedSelector(selectTotalStakedAmountForUri, (amount) => {
  let level = 1;
  switch (true) {
    case amount >= CLAIM.LEVEL_2_STAKED_AMOUNT && amount < CLAIM.LEVEL_3_STAKED_AMOUNT:
      level = 2;
      break;
    case amount >= CLAIM.LEVEL_3_STAKED_AMOUNT && amount < CLAIM.LEVEL_4_STAKED_AMOUNT:
      level = 3;
      break;
    case amount >= CLAIM.LEVEL_4_STAKED_AMOUNT && amount < CLAIM.LEVEL_5_STAKED_AMOUNT:
      level = 4;
      break;
    case amount >= CLAIM.LEVEL_5_STAKED_AMOUNT:
      level = 5;
      break;
  }
  return level;
})((state, uri) => String(uri));

export const selectCreatingCollectionIds = (state: State) => selectState(state).creatingCollectionIds;
export const selectUpdatingCollectionIds = (state: State) => selectState(state).updatingCollectionIds;

export const selectIsCreatingCollectionForId = (state: State, collectionId: string) =>
  new Set(selectCreatingCollectionIds(state)).has(collectionId);
export const selectIsUpdatingCollectionForId = (state: State, collectionId: string) =>
  new Set(selectUpdatingCollectionIds(state)).has(collectionId);

export const selectIsMyChannelCountOverLimit = createSelector(
  selectMyChannelClaimIds,
  selectYoutubeChannels,
  (myClaimIds, ytChannels: ?Array<{ channel_claim_id: string }>) => {
    if (myClaimIds) {
      if (ytChannels && ytChannels.length > 0) {
        // $FlowFixMe - null 'ytChannels' already excluded
        const ids = myClaimIds.filter((id) => !ytChannels.some((yt) => yt.channel_claim_id === id));
        return ids.length > CHANNEL_CREATION_LIMIT;
      }
      return myClaimIds.length > CHANNEL_CREATION_LIMIT;
    }
    return false;
  }
);

export const selectGeoRestrictionForUri = createCachedSelector(
  selectClaimForUri,
  selectGeoBlockLists,
  selectUserLocale,
  (claim, geoBlockLists, locale: LocaleInfo) => {
    return getGeoRestrictionForClaim(claim, locale, geoBlockLists);
  }
)((state, uri) => String(uri));

export const selectClaimRepostedAmountForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state);
  return getClaimRepostedAmount(claim);
};

export const selectTakeOverAmountForName = (state: State, name: string) => {
  if (!name) {
    return null;
  }

  const shortUri = buildURI({ streamName: name });
  const winningClaim = selectClaimForUri(state, shortUri);

  return winningClaim ? winningClaim.meta.effective_amount || winningClaim.amount : null;
};

export const selectIsFetchingPurchases = (state: State) => selectState(state).fetchingMyPurchasedClaims;

export const selectMyPurchasedClaims = createSelector(selectState, (state) => state.myPurchasedClaims || []);

export const selectPurchaseMadeForClaimId = (state: State, claimId: string) => {
  const purchasedClaims = selectMyPurchasedClaims(state);
  return purchasedClaims.some(
    (p) => (p.reference_claim_id === claimId || p.target_claim_id === claimId) && p.type === 'purchase'
  );
};

export const selectValidRentalPurchaseForClaimId = (state: State, claimId: string) => {
  const purchasedClaims = selectMyPurchasedClaims(state);

  const validRentalClaimForClaimId = purchasedClaims.find((purchase) => {
    return (
      purchase.target_claim_id === claimId &&
      purchase.type === 'rental' &&
      new Date(purchase.valid_through) > new Date() // expiry date is sometime in the future
    );
  });

  return validRentalClaimForClaimId;
};

export const selectIsFiatRequiredForUri = (state: State, uri: string) => {
  return Boolean(selectPurchaseTagForUri(state, uri)) || Boolean(selectRentalTagForUri(state, uri));
};

export const selectPendingFiatPaymentForUri = (state: State, uri: string) => {
  const claimIsMine = selectClaimIsMineForUri(state, uri);
  const fiatRequired = selectIsFiatRequiredForUri(state, uri);
  const fiatPaid = selectIsFiatPaidForUri(state, uri);
  const isFetchingPurchases = selectIsFetchingPurchases(state);

  const pendingFiatPayment = !claimIsMine && fiatRequired && (!fiatPaid || isFetchingPurchases);

  return pendingFiatPayment;
};

export const selectIsAnonymousFiatContentForUri = (state: State, uri: string) => {
  const fiatRequired = selectIsFiatRequiredForUri(state, uri);
  const channelClaimId = selectChannelClaimIdForUri(state, uri);

  const isAnonymousFiatContent = fiatRequired && !channelClaimId;

  return isAnonymousFiatContent;
};

export const selectIsFiatPaidForUri = (state: State, uri: string) => {
  const claimId = (selectClaimForUri(state, uri) || {}).claim_id;
  if (claimId) {
    return (
      Boolean(selectPurchaseMadeForClaimId(state, claimId)) ||
      Boolean(selectValidRentalPurchaseForClaimId(state, claimId))
    );
  }
};

export const selectIsClaimOdyseeChannelForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  const claimId = getChannelIdFromClaim(claim);
  return claimId === ODYSEE_CHANNEL.ID;
};

export const selectClaimHasSupportsForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  const hasSupport = claim && claim.meta && claim.meta.support_amount && Number(claim.meta.support_amount) > 0;

  return hasSupport;
};

export const selectCostInfoForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  if (!claimId) return claimId;

  const byId = selectCostInfosById(state);
  const costInfo = byId[claimId];

  return costInfo;
};

export const selectSdkFeePendingForUri = (state: State, uri: string) => {
  const claimIsMine = selectClaimIsMineForUri(state, uri);
  const costInfo = selectCostInfoForUri(state, uri);
  const sdkFeePending = costInfo === undefined || (costInfo && costInfo.cost !== 0);
  const sdkPaid = selectClaimWasPurchasedForUri(state, uri);

  const pendingSdkPayment = !claimIsMine && sdkFeePending && !sdkPaid;

  return pendingSdkPayment;
};

export const selectPendingPurchaseForUri = (state: State, uri: string) => {
  const pendingFiatPayment = selectPendingFiatPaymentForUri(state, uri);
  const pendingSdkPayment = selectSdkFeePendingForUri(state, uri);

  return pendingFiatPayment || pendingSdkPayment;
};
