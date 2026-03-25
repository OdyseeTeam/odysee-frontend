/**
 * Collection / playlist types.
 */

type Collection = {
  id: string;
  items: Array<string>;
  name: string;
  type: string;
  updatedAt?: number;
  createdAt?: number;
  sourceId?: string;
  key?: string;
  itemCount?: number;
  [key: string]: any;
};

type CollectionEditParams = {
  uris?: Array<string>;
  remove?: boolean;
  replace?: boolean;
  order?: { from: number; to: number };
  type?: string;
  name?: string;
  description?: string;
  thumbnail?: { url: string };
  [key: string]: any;
};

type CollectionPublishCreateParams = {
  name: string;
  bid: string;
  claims: Array<string>;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  tags?: Array<string>;
  languages?: Array<string>;
  channel_id?: string;
  [key: string]: any;
};

type CollectionPublishUpdateParams = CollectionPublishCreateParams & {
  claim_id: string;
};

type CollectionLocalCreateParams = {
  name: string;
  items: Array<string>;
  type: string;
  sourceId?: string;
};

type CollectionType = string;
type CollectionGroup = Record<string, Collection>;
type UpdatedCollectionGroup = Record<string, Collection>;
type CollectionState = {
  [key: string]: any;
};
