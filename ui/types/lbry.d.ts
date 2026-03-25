/**
 * LBRY SDK and API types.
 *
 * Types for the LBRY protocol, URI handling, and SDK responses.
 */

type LbryUrlObj = {
  isChannel?: boolean;
  streamName?: string;
  streamClaimId?: string;
  channelName?: string;
  channelClaimId?: string;
  primaryClaimSequence?: number;
  secondaryClaimSequence?: number;
  primaryBidPosition?: number;
  secondaryBidPosition?: number;
  startTime?: number;
  path?: string;
  queryString?: string;
  // Deprecated fields still returned by parseURI
  claimName?: string;
  claimId?: string;
  contentName?: string;
  pathHash?: string;
};

type StatusResponse = {
  blob_manager: { finished_blobs: number };
  connection_status: {
    code: string;
    message: string;
  };
  installation_id: string;
  is_running: boolean;
  skipped_components: Array<string>;
  startup_status: { database: boolean; wallet: boolean; blob_manager: boolean };
  stream_manager: { managed_files: number };
  uptime: number;
  wallet?: {
    available_servers: number;
    best_blockhash: string;
    blocks: number;
    blocks_behind: number;
    connected: string;
    headers_synchronization_progress: number;
    is_encrypted: boolean;
    is_locked: boolean;
    is_syncing: boolean;
    known_servers: number;
    servers: Array<any>;
  };
};

type WalletStatusResponse = {
  is_encrypted: boolean;
  is_locked: boolean;
  is_syncing: boolean;
  available: boolean;
};

type WalletBalance = {
  available: string;
  reserved: string;
  reserved_subtotals: {
    claims: string;
    supports: string;
    tips: string;
  };
  total: string;
};

type Txo = {
  amount: string;
  claim_id: string;
  claim_name?: string;
  confirmations: number;
  height: number;
  is_change: boolean;
  is_mine: boolean;
  is_my_input?: boolean;
  is_my_output?: boolean;
  is_received: boolean;
  is_spent: boolean;
  normalized_name?: string;
  nout: number;
  timestamp: number;
  txid: string;
  type: string;
  value_type?: string;
  signing_channel?: { name: string; claim_id: string; channel_id?: string };
};

type Transaction = {
  amount: string;
  claim_id: string;
  claim_name: string;
  confirmations: number;
  date: string;
  fee: string;
  height: number;
  nout: number;
  timestamp: number;
  txid: string;
  type: string;
};

type Support = {
  amount: string;
  claim_id: string;
  confirmations: number;
  is_tip: boolean;
  nout: number;
  txid: string;
  timestamp?: number;
};

type PublishResponse = {
  outputs: Array<Claim>;
};

type PublishParams = {
  name: string;
  bid?: string;
  file_path?: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  tags?: Array<string>;
  languages?: Array<string>;
  channel_id?: string;
  channel_name?: string;
  claim_id?: string;
  release_time?: number;
  license?: string;
  license_url?: string;
  fee_amount?: string;
  fee_currency?: string;
  [key: string]: any;
};

type GenericPublishCreateParams = PublishParams;
type GenericPublishUpdateParams = PublishParams & { claim_id: string };

type StreamRepostOptions = {
  name: string;
  bid: string;
  claim_id: string;
  channel_id?: string;
};

type FileGetOptions = {
  uri?: string;
  outpoint?: string;
  claim_id?: string;
};

type LbryTypes = {
  [key: string]: any;
};

type LbryFirstTypes = {
  [key: string]: any;
};

type PurchaseListResponse = {
  items: Array<any>;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type ReplayListResponse = {
  items: Array<any>;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type UrlLocation = {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
};

type FypParam = {
  gid?: string;
  uuid?: string;
  [key: string]: any;
};

type UpdatePendingClaimsAction = {
  type: string;
  data: any;
};

type DoUpdatePublishForm = (data: Partial<PublishState>) => void;
type DoDebugLog = (...args: any[]) => void;

type SuperListParams = {
  claim_id: string;
  page?: number;
  page_size?: number;
  [key: string]: any;
};

type WebsocketSettingDataResponse = {
  [key: string]: any;
};

type Sections = {
  entries: Array<any>;
  [key: string]: any;
};
