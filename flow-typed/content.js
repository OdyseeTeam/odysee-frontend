// @flow

declare type ContentState = {|
  primaryUri: ?string, // Top level content uri triggered from the file page
  playingUri: PlayingUri,
  uriAccessKeys: { [uri: string]: ?UriAccessKey }, // Verified access keys for unlisted uris.
  positions: { [claimId: string]: { [outpoint: string]: number } },
  history: Array<WatchHistory>,
  // -- Outliers; should move to another slice --------------------------------
  lastViewedAnnouncement: ?LastViewedAnnouncement, // undefined = not seen in wallet.
  recsysEntries: { [ClaimId]: RecsysEntry }, // Persistent shadow copy. The main one resides in RecSys.
  // --------------------------------------------------------------------------
  autoplayCountdownUri: ?string,
|};

declare type UriAccessKey = {|
  signature: string,
  signature_ts: string, // Backend uses 'signature_ts', SDK uses 'signing_ts' :(
|};

declare type SaveUriAccessKeyAction = {|
  type: 'SAVE_URI_ACCESS_KEY',
  data: {| uri: string, accessKey: UriAccessKey |},
|}

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

declare type VideojsClientState = {|
  defaultQuality?: string,
  originalVideoHeight?: number,
|};
