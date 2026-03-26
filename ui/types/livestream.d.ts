/**
 * Livestream types.
 */

type LivestreamActiveClaim = {
  claimId: string;
  claimUri: string;
  startedStreaming?: string;
  viewerCount?: number;
  [key: string]: any;
};

type LivestreamInfo = {
  live: boolean;
  viewCount?: number;
  start?: string;
  [key: string]: any;
};

type LivestreamInfoByCreatorIds = Record<string, LivestreamInfo>;
type LivestreamByCreatorId = Record<string, LivestreamActiveClaim>;
type LivestreamViewersById = Record<string, number>;

type LivestreamAllResponse = {
  data: Array<{
    claimId: string;
    claimUri: string;
    [key: string]: any;
  }>;
};

type LivestreamClaimResponse = {
  data?: {
    live: boolean;
    start?: string;
    viewCount?: number;
  };
};

type LivestreamIsLiveResponse = {
  data?: {
    live: boolean;
    viewCount?: number;
    start?: string;
  };
};

type LivestreamReplayItem = {
  data: {
    claimId: string;
    url: string;
    [key: string]: any;
  };
};

type LiveCreateType = {
  name: string;
  bid: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  tags?: Array<string>;
  languages?: Array<string>;
  channel_id?: string;
  release_time?: number;
  [key: string]: any;
};

type LiveEditType = LiveCreateType & {
  claim_id: string;
};
