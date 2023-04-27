// @flow

declare type ContentState = {|
  primaryUri: ?string,
  playingUri: PlayingUri,
  positions: { [claimId: string]: { [outpoint: string]: number } },
  history: Array<WatchHistory>,
  // -- Outliers; should move to another slice --------------------------------
  lastViewedAnnouncement: ?LastViewedAnnouncement, // undefined = not seen in wallet.
  recsysEntries: { [ClaimId]: RecsysEntry }, // Persistent shadow copy. The main one resides in RecSys.
  // --------------------------------------------------------------------------
  autoplayCountdownUri: ?string,
|};

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

declare type OdyseeState = {|
|};
