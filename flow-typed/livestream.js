// @flow

declare type LivestreamReplayItem = {
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
declare type LivestreamReplayData = Array<LivestreamReplayItem>;

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
  releaseTime: string,
};

declare type LivestreamInfo = {
  url: string,
  type: string,
  isLive: boolean,
  viewCount: number,
  creatorId: string,
  startedStreaming: any,
  activeClaim: LivestreamActiveClaim,
  pastClaims: ?Array<LivestreamActiveClaim>,
  futureClaims: ?Array<LivestreamActiveClaim>,
};

declare type LivestreamInfoByCreatorIds = {
  [creatorId: string]: LivestreamInfo,
};
