/**
 * Flow types for the Claims slice.
 */

// @flow

declare type ClaimsState = {
  createChannelError: ?string,
  channelClaimCounts: { [uri: string]: number },
  claimsByUri: { [uri: string]: ClaimId },
  byId: { [ClaimId]: Claim },
  pendingById: { [ClaimId]: Claim }, // keep pending claims
  resolvingIds: Array<ClaimId>,
  resolvingUris: Array<string>,
  reflectingById: { [ClaimId]: ReflectingUpdate },
  myClaims: ?Array<ClaimId>,
  myChannelClaimsById: ?{ [channelClaimId: string]: ChannelClaim },
  resolvedCollectionsById: { [collectionClaimId: string]: Collection },
  myCollectionClaimIds: ?Array<string>,
  abandoningById: { [string]: boolean },
  fetchingChannelClaims: { [string]: number },
  fetchingMyChannels: boolean,
  fetchingMyChannelsSuccess: ?boolean,
  fetchingClaimSearchByQuery: { [string]: boolean },
  purchaseUriSuccess: boolean,
  myPurchases: ?Array<string>,
  myPurchasesPageNumber: ?number,
  myPurchasesPageTotalResults: ?number,
  fetchingMyPurchases: boolean,
  fetchingMyPurchasesError: ?string,
  claimSearchByQuery: { [string]: Array<string> },
  claimSearchByQueryLastPageReached: { [string]: Array<boolean> },
  claimSearchByQueryMiscInfo: { [query: string]: ClaimSearchResultsInfo },
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
  isFetchingClaimListMineSuccess: ?boolean,
  isCheckingNameForPublish: boolean,
  checkingPending: boolean,
  checkingReflecting: boolean,
  latestByUri: { [string]: any },
  myPurchasedClaims: Array<any>, // bad naming; not a claim but a stripe response.
  fetchingMyPurchasedClaims: ?boolean,
  fetchingMyPurchasedClaimsError: ?string,
  costInfosById: { [claimId: string]: { cost: number, includesData?: boolean } },
};

declare type ClaimSearchResultsInfo = {|
  page: number, // last queried page
  pageSize: number,
  totalItems?: number,
  totalPages?: number,
|};

// ****************************************************************************
// Action Creators
// ****************************************************************************

declare type UpdatePendingClaimsAction = {|
  type: 'UPDATE_PENDING_CLAIMS',
  data: {
    claims: Array<Claim>,
    options?: {|
      overrideTags?: boolean,
      overrideSigningChannel?: boolean,
    |},
  },
|};
