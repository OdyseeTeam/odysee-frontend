declare type SyncState = {
  hasSyncedWallet: boolean,
  syncHash: ?string,
  syncData: ?string,
  setSyncErrorMessage: ?string,
  getSyncErrorMessage: ?string,
  syncApplyErrorMessage: string,
  syncApplyIsPending: boolean,
  syncApplyPasswordError: boolean,
  getSyncIsPending: boolean,
  setSyncIsPending: boolean,
  prefsReady: boolean,
  syncLocked: boolean,
  hashChanged: boolean,
  fatalError: boolean,
};

declare type WalletUpdate = {
  changed: boolean,
  data: string,
  hash: string,
  version: number,
};
