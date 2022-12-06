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

declare type LivestreamActiveClaim = {
  ClaimID: string,
  CanonicalURL: string,
  ReleaseTime: string,
  Protected: boolean,
};

declare type ActiveLivestreamResponse = {
  Live: boolean,
  Start: string,
  VideoURL: string,
  ThumbnailURL: string,
  ViewerCount: number,
  ChannelClaimID: string,
  ActiveClaim: LivestreamActiveClaim,
  PastClaims: Array<LivestreamActiveClaim>,
  FutureClaims: ?Array<LivestreamActiveClaim>,
};

declare type ActiveLivestream = {
  url: string,
  type: string,
  live: boolean,
  viewCount: number,
  creatorId: string,
  startedStreaming: any,
  claimId: string,
  claimUri: string,
};

declare type ActiveLivestreamByCreatorIds = {
  [creatorId: string]: ActiveLivestream,
};

declare type LivestreamAllResponse = Array<ActiveLivestreamResponse>;
