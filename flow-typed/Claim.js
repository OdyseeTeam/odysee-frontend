// @flow

declare type Claim = StreamClaim | ChannelClaim | CollectionClaim;

declare type ChannelClaim = GenericClaim & {
  value: ChannelMetadata,
  featured: Array<string>,
};

declare type CollectionClaim = GenericClaim & {
  value: CollectionMetadata,
};

declare type StreamClaim = GenericClaim & {
  value: StreamMetadata,
};

declare type GenericClaim = {
  address: string, // address associated with tx
  amount: string, // bid amount at time of tx
  canonical_url: string, // URL with short id, includes channel with short id
  claim_id: string, // unique claim identifier
  channel_id?: string, // shown if signing channel can't be resolved
  claim_sequence: number, // not being used currently
  claim_op: 'create' | 'update',
  confirmations: number,
  decoded_claim: boolean, // Not available currently https://github.com/lbryio/lbry/issues/2044
  timestamp?: number, // date of last transaction
  height: number, // block height the tx was confirmed
  is_channel_signature_valid?: boolean,
  is_my_output: boolean,
  name: string,
  normalized_name: string, // `name` normalized via unicode NFD spec,
  nout: number, // index number for an output of a tx
  permanent_url: string, // name + claim_id
  short_url: string, // permanent_url with short id, no channel
  txid: string, // unique tx id
  type: 'claim' | 'update' | 'support',
  value_type: 'stream' | 'channel' | 'collection',
  signing_channel?: ChannelClaim,
  reposted_claim?: Claim,
  repost_channel_url?: string,
  repost_url?: string,
  repost_bid_amount?: string,
  purchase_receipt?: PurchaseReceipt,
  meta: {
    activation_height: number,
    claims_in_channel?: number,
    creation_height: number,
    creation_timestamp: number,
    effective_amount: string,
    expiration_height: number,
    is_controlling: boolean,
    support_amount: string,
    reposted: number,
    trending_global: number,
    trending_group: number,
    trending_local: number,
    trending_mixed: number,
  },
};

declare type ClaimUri = string; // can be permanent or canonical

declare type ClaimId = string;

declare type ClaimIds = Array<ClaimId>;

declare type CollectionId = ClaimId | string; // uuid

declare type ChannelId = ClaimId;

declare type GenericMetadataKey = 'title' | 'description' | 'thumbnail' | 'languages' | 'tags' | 'locations';
declare type GenericMetadata = {
  title?: string,
  description?: string,
  thumbnail?: {
    url?: string,
  },
  languages?: Array<string>,
  tags?: Array<string>,
  locations?: Array<Location>,
  fee?: Fee,
  video?: {
    duration: number,
    height: number,
    width: number,
  },
  audio?: {
    duration: number,
  },
};

declare type ChannelMetadataKey =
  | GenericMetadataKey
  | 'public_key'
  | 'public_key_id'
  | 'cover_url'
  | 'email'
  | 'website_url'
  | 'featured';
declare type ChannelMetadata = GenericMetadata & {
  public_key: string,
  public_key_id: string,
  cover_url?: string,
  email?: string,
  website_url?: string,
  featured?: Array<string>,
};

declare type CollectionMetadataKey = GenericMetadataKey | 'claims';
declare type CollectionMetadata = GenericMetadata & {
  claims: Array<string>,
};

declare type StreamMetadataKey =
  | GenericMetadataKey
  | 'license'
  | 'license_url'
  | 'release_time'
  | 'author'
  | 'source'
  | 'fee'
  | 'stream_type'
  | 'video'
  | 'audio'
  | 'image'
  | 'software';
declare type StreamMetadata = GenericMetadata & {
  license?: string, // License "title" ex: Creative Commons, Custom copyright
  license_url?: string, // Link to full license
  release_time?: number, // linux timestamp
  author?: string,

  source: {
    sd_hash: string,
    media_type?: string,
    hash?: string,
    name?: string, // file name
    size?: number, // size of file in bytes
  },

  // Only exists if a stream has a fee
  fee?: Fee,

  stream_type: 'video' | 'audio' | 'image' | 'software',
  // Below correspond to `stream_type`
  video?: {
    duration: number,
    height: number,
    width: number,
  },
  audio?: {
    duration: number,
  },
  image?: {
    height: number,
    width: number,
  },
  software?: {
    os: string,
  },
};

declare type Location = {
  latitude?: number,
  longitude?: number,
  country?: string,
  state?: string,
  city?: string,
  code?: string,
};

declare type Fee = {
  amount: string,
  currency: string,
  address: string,
};

declare type PurchaseReceipt = {
  address: string,
  amount: string,
  claim_id: string,
  confirmations: number,
  height: number,
  nout: number,
  timestamp: number,
  txid: string,
  type: 'purchase',
};

declare type ClaimActionResolveInfo = {
  [string]: {
    stream: ?StreamClaim,
    channel: ?ChannelClaim,
    claimsInChannel: ?number,
    collection: ?CollectionClaim,
  },
};

declare type GenericPublishParams = {
  bid: string | number,
  channel_id?: ?string,
  title?: string,
  description?: string,
  thumbnail_url?: string,
  languages?: Array<string>,
  tags?: Array<string>,
  locations?: Array<Location>,
  blocking?: boolean,
};

declare type GenericPublishUpdateParams = GenericPublishParams & {
  claim_id: string,
  replace?: boolean,
};
declare type GenericPublishCreateParams = GenericPublishParams & {
  name: string,
};

declare type ChannelPublishParams = {
  website_url?: string,
  email?: string,
  cover_url?: string,
};
declare type ChannelPublishUpdateParams = GenericPublishUpdateParams & ChannelPublishParams;
declare type ChannelPublishCreateParams = GenericPublishCreateParams & ChannelPublishParams;

declare type ClaimScheduledState = 'non-scheduled' | 'scheduled' | 'started';
