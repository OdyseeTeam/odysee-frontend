// @flow

declare type LivestreamReplayItem_OBSOLETE = {
  data: {
    claimId: string,
    deleted: boolean,
    deletedAt: ?string,
    ffprobe: any,
    fileDuration: number, // decimal? float? string?
    fileType: string,
    fileLocation: string,
    fileSize: number,
    key: string,
    published: boolean,
    publishedAt: ?string,
    service: string,
    thumbnails: Array<string>,
    uploadedAt: string, // Date?
  },
  id: string,
};

declare type LivestreamReplayItem = {|
  data: {|
    fileDuration: number | string, // should just be number, but was used as string
    fileLocation: string,
    percentComplete: number,
    thumbnails: Array<string>,
    uploadedAt: number,
  |},
|};

// @see livestreamer -> replays.go
declare type ReplayListResponse = {
  Status: string,
  PercentComplete: number,
  URL: string,
  ThumbnailURLs: Array<string>,
  Duration: number,
  Created: number,
};

declare type LivestreamClaimResponse = {
  ClaimID: string,
  CanonicalURL: string,
  ReleaseTime: string,
  Protected: boolean,
};

declare type LivestreamIsLiveResponse = {
  Live: boolean,
  Start: string,
  VideoURL: string,
  ThumbnailURL: string,
  ViewerCount: number,
  ChannelClaimID: string,
  ActiveClaim: LivestreamClaimResponse,
  PastClaims: Array<LivestreamClaimResponse>,
  FutureClaims: ?Array<LivestreamClaimResponse>,
};

declare type LivestreamAllResponse = Array<LivestreamIsLiveResponse>;

declare type LivestreamActiveClaim = {
  uri: string,
  claimId: string,
  videoUrl?: string,
  startedStreaming?: any,
  releaseTime: string,
};

declare type LivestreamInfo = {
  url: string,
  type: string,
  isLive: boolean,
  viewCount: number,
  creatorId: string,
  activeClaim: LivestreamActiveClaim,
  pastClaims: ?Array<LivestreamActiveClaim>,
  futureClaims: ?Array<LivestreamActiveClaim>,
};

declare type LivestreamInfoByCreatorIds = {
  [creatorId: string]: LivestreamInfo,
};

declare type LivestreamByCreatorId = { [creatorId: string]: ?LivestreamActiveClaim };
declare type LivestreamViewersById = { [claimId: string]: number };
