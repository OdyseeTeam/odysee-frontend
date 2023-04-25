// @flow

declare type ContentState = {
  primaryUri: ?string,
  playingUri: PlayingUri,
  positions: { [string]: { [string]: number } }, // claimId: { outpoint: position }
  history: Array<WatchHistory>,
  lastViewedAnnouncement: LastViewedAnnouncement, // undefined = not seen in wallet.
  recsysEntries: { [ClaimId]: RecsysEntry }, // Persistent shadow copy. The main one resides in RecSys.
  autoplayCountdownUri: ?string,
};

declare type LastViewedAnnouncement = Array<string>;

declare type WatchHistory = {
  uri: string,
  lastViewed: number,
};

declare type PlayingUri = {
  uri?: ?string,
  primaryUri?: string,
  location?: { pathname: ?string, search: ?string },
  commentId?: string,
  collection: PlayingCollection,
  source?: ?string,
  sourceId?: string,
};

declare type PlayingCollection = {
  collectionId?: ?string,
  loop?: ?boolean,
  shuffle?: ?{ newUrls: Array<string> },
};
