/**
 * Claim domain model types.
 *
 * Core types for the LBRY claim system — streams, channels, collections, reposts.
 */

type ClaimId = string;
type ClaimIds = Array<ClaimId>;
type ClaimUri = string;
type ChannelId = string;

type GenericMetadata = {
  title?: string;
  description?: string;
  thumbnail?: { url?: string };
  languages?: Array<string>;
  tags?: Array<string>;
};

type Fee = {
  amount: string;
  currency: string;
  address: string;
};

type StreamMetadata = GenericMetadata & {
  license?: string;
  license_url?: string;
  release_time?: number;
  fee?: Fee;
  author?: string;
  stream_type?: string;
  locations?: Array<any>;
  source?: {
    media_type?: string;
    hash?: string;
    name?: string;
    size?: string;
    sd_hash?: string;
  };
  video?: {
    duration?: number;
    height?: number;
    width?: number;
  };
  audio?: {
    duration?: number;
  };
  image?: {
    height?: number;
    width?: number;
  };
  software?: {
    os?: string;
  };
};

type ChannelMetadata = GenericMetadata & {
  public_key?: string;
  public_key_id?: string;
  cover_url?: string;
  email?: string;
  website_url?: string;
  featured?: Array<string>;
  locations?: Array<any>;
};

type CollectionMetadata = GenericMetadata;
type StreamMetadataKey = keyof StreamMetadata;
type ChannelMetadataKey = keyof ChannelMetadata;
type CollectionMetadataKey = keyof CollectionMetadata;

type Claim = {
  address: string;
  amount: string;
  canonical_url: string;
  claim_id: ClaimId;
  claim_op: string;
  claim_sequence?: number;
  confirmations: number;
  decoded_claim?: boolean;
  effective_amount?: string;
  has_signing_key?: boolean;
  height: number;
  is_channel_signature_valid?: boolean;
  is_my_output?: boolean;
  meta?: {
    activation_height: number;
    claims_in_channel?: number;
    creation_height: number;
    creation_timestamp: number;
    effective_amount: string;
    expiration_height: number;
    is_controlling: boolean;
    reposted: number;
    support_amount: string;
    take_over_height?: number;
    trending_global?: number;
    trending_group?: number;
    trending_local?: number;
    trending_mixed?: number;
  };
  name: string;
  normalized_name: string;
  nout: number;
  permanent_url: string;
  reposted_claim?: Claim;
  short_url: string;
  signing_channel?: ChannelClaim;
  timestamp: number;
  txid: string;
  type: string;
  value?: StreamMetadata | ChannelMetadata | CollectionMetadata;
  value_type: 'stream' | 'channel' | 'collection' | 'repost';
};

type StreamClaim = Claim & {
  value_type: 'stream';
  value?: StreamMetadata;
};

type ChannelClaim = Claim & {
  value_type: 'channel';
  value?: ChannelMetadata;
};

type CollectionClaim = Claim & {
  value_type: 'collection';
  value?: CollectionMetadata;
};

type GenericClaim = Claim;

type ClaimSearchOptions = {
  page_size?: number;
  page?: number;
  no_totals?: boolean;
  any_tags?: Array<string>;
  not_tags?: Array<string>;
  channel_ids?: Array<string>;
  claim_ids?: Array<string>;
  not_channel_ids?: Array<string>;
  order_by?: Array<string>;
  release_time?: string;
  claim_type?: string | Array<string>;
  name?: string;
  duration?: string | string[];
  fee_amount?: string;
  has_source?: boolean;
  has_no_source?: boolean;
  limit_claims_per_channel?: number;
  stream_types?: Array<string>;
  [key: string]: any;
};

type ClaimSearchResponse = {
  items: Array<Claim>;
  page: number;
  page_size: number;
  total_items?: number;
  total_pages?: number;
};

type ClaimListResponse = {
  items: Array<Claim>;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type ClaimActionResolveInfo = {
  [key: string]: {
    stream?: Claim;
    channel?: Claim;
    collection?: Claim;
    claimsInChannel?: number;
  };
};

type ClaimScheduledState = 'scheduled' | 'started' | 'non-scheduled';

type ResolveResponse = {
  [key: string]: Claim | { error?: { name: string; text: string } };
};

type GetResponse = Claim & {
  streaming_url?: string;
  download_path?: string;
};

type ChannelSignResponse = {
  signature: string;
  signing_ts: string;
};

type ChannelListResponse = ClaimListResponse;
type StreamListResponse = ClaimListResponse;
type ChannelCreateResponse = Claim & { outputs: Array<Claim> };
type ChannelUpdateResponse = Claim & { outputs: Array<Claim> };
type CollectionCreateResponse = Claim;
type CollectionListResponse = ClaimListResponse;
type CollectionListOptions = {
  page?: number;
  page_size?: number;
  resolve_claims?: number;
  resolve?: boolean;
};

type ChannelCreateParam = {
  name: string;
  bid: string;
  title?: string;
  cover_url?: string;
  thumbnail_url?: string;
  description?: string;
  website_url?: string;
  email?: string;
  tags?: Array<string>;
  languages?: Array<string>;
  blocking?: boolean;
};

type VerifyClaimSignatureParams = {
  claim_id: string;
  channel_name: string;
  channel_id: string;
  signature: string;
  signing_ts: string;
};

type VerifyClaimSignatureResponse = {
  is_valid: boolean;
};

type DoClaimSearchSettings = {
  options?: ClaimSearchOptions;
  useAutoPagination?: boolean;
  fetch?: { viewCount?: boolean; [key: string]: any };
  [key: string]: any;
};

type ShortUrlResponse = {
  short_url: string;
};
