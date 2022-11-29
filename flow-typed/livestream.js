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

declare type LivestreamState = {
  fetchingById: {},
  viewersById: {},
  activeLivestreamsFetchingQueries: Array<string>,
  activeLivestreams: ?ActiveLivestreamInfosById,
  activeLivestreamsLastFetchedDate: number,
  activeLivestreamsLastFetchedFailCount: number,
  socketConnectionById: { [id: string]: { connected: ?boolean, sub_category: ?string } },
  isLivePollingChannelIds: Array<string>,
};

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

declare type ActiveLivestreamInfo = {
  url: string,
  type: string,
  live: boolean,
  viewCount: number,
  creatorId: string,
  startedStreaming: any,
};

declare type ActiveLivestreamInfosById = {
  [creatorId: string]: ActiveLivestreamInfo,
};

declare type ActiveLivestream = ActiveLivestreamInfo & {
  claimId: string,
  claimUri: string,
};

declare type ActiveLivestreamsById = {
  [creatorId: string]: ActiveLivestream,
};

declare type LivestreamAllResponse = Array<ActiveLivestreamResponse>;
