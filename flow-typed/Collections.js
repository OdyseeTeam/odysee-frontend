declare type Collection = {
  id: string,
  items: Array<any>,
  name: string,
  title?: string,
  description?: string,
  thumbnail?: {
    url?: string,
  },
  type: CollectionType,
  createdAt?: ?number,
  updatedAt: number,
  itemCount?: number,
  sourceId?: string, // if copied, claimId of original collection
  featuredChannelsParams?: {
    channelId: string,
  },
};

declare type CollectionType = 'playlist' | 'channelList' | 'featuredChannels' | 'collection'; // Must match COL_TYPES

declare type CollectionState = {
  // -- sync --
  unpublished: CollectionGroup,
  edited: CollectionGroup,
  unsavedChanges?: CollectionGroup,
  updated: UpdatedCollectionGroup,
  builtin: CollectionGroup,
  savedIds: Array<string>,
  resolvedIds: ?Array<string>,
  // -- local --
  collectionItemsFetchingIds: Array<string>,
  queue: Collection,
  lastUsedCollection: ?string,
  isFetchingMyCollections: ?boolean,
  thumbnailClaimsFetchingCollectionIds: Array<string>,
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
  isPreview?: boolean,
  order?: { from: number, to: number },
  type?: CollectionType,
  name?: string,
  title?: string,
  description?: string,
  thumbnail_url?: string,
};

declare type CollectionFetchItemsParams = {
  collectionId: string,
  pageSize?: number,
};

declare type CollectionItemFetchResult = {
  collectionId: string,
  items: ?Array<GenericClaim>,
};
