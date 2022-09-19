declare type Collection = {
  id: string,
  items: Array<string>,
  name: string,
  title?: string,
  description?: string,
  thumbnail?: {
    url?: string,
  },
  type: CollectionType,
  createdAt?: ?number,
  updatedAt: number,
  totalItems?: number,
  itemCount?: number,
  sourceId?: string, // if copied, claimId of original collection
  featuredChannelsParams?: {
    channelId: string,
  },
};

declare type CollectionType = 'playlist' | 'channelList' | 'featuredChannels' | 'collection'; // Must match COL_TYPES

declare type CollectionState = {
  unpublished: CollectionGroup,
  edited: CollectionGroup,
  updated: UpdatedCollectionGroup,
  builtin: CollectionGroup,
  savedIds: Array<string>,
  error?: string | null,
  queue: Collection,
  lastUsedCollection: ?string,
  featuredChannelsPublishing: boolean,
  isFetchingMyCollectionClaims: boolean,
  collectionItemsFetchingIds: Array<string>,
  resolvedIds: ?Array<string>,
};

declare type CollectionGroup = {
  [id: string]: Collection,
};

declare type UpdatedCollectionGroup = {
  [id: string]: UpdatedCollection,
};

declare type UpdatedCollection = {
  id: string,
  updatedAt: number,
};

declare type CollectionList = Array<Collection>;

declare type CollectionLocalCreateParams = {
  name?: string,
  title?: string,
  description?: string,
  thumbnail?: {
    url?: string,
  },
  items: ?Array<string>,
  type: CollectionType,
  sourceId?: string, // if copied, claimId of original collection
  featuredChannelsParams?: {
    channelId: string,
  },
};

declare type CollectionEditParams = {
  uris?: Array<string>,
  remove?: boolean,
  replace?: boolean,
  order?: { from: number, to: number },
  type?: CollectionType,
  name?: string,
  title?: string,
  description?: string,
  thumbnail?: {
    url?: string,
  },
};

declare type CollectionFetchParams = {
  collectionId: string,
  pageSize?: number,
};

declare type CollectionItemFetchResult = {
  collectionId: string,
  items: ?Array<GenericClaim>,
};

declare type CollectionPublishParams = GenericPublishParams & {
  claims: Array<string>,
};

declare type CollectionUpdateParams = GenericUpdateParams & {
  claims?: Array<string>,
  clear_claims: boolean,
};

declare type CollectionCreateResponse = {
  outputs: Array<CollectionClaim>,
  page: number,
  page_size: number,
  total_items: number,
  total_pages: number,
};

declare type CollectionListResponse = {
  items: Array<CollectionClaim>,
  page: number,
  page_size: number,
  total_items: number,
  total_pages: number,
};

declare type CollectionResolveResponse = {
  items: Array<Claim>,
  total_items: number,
};

declare type CollectionResolveOptions = {
  claim_id: string,
};

declare type CollectionListOptions = {
  page: number,
  page_size: number,
  resolve?: boolean,
};
