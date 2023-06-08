// @flow

declare type PublishType = 'file' | 'post' | 'livestream';
declare type LiveCreateType = 'new_placeholder' | 'choose_replay' | 'edit_placeholder';
declare type LiveEditType = 'update_only' | 'use_replay' | 'upload_replay';

declare type Paywall = 'free' | 'fiat' | 'sdk';
declare type Visibility = 'public' | 'unlisted' | 'private' | 'scheduled';

declare type PublishParams = {
  // --- Odysee API ---
  remote_url?: string,
  claim_id?: string, // I think this is for edits
  // --- LBRY SDK ---
  name: string,
  bid?: number,
  file_path?: string,
  file_name?: string,
  optimize_file?: boolean,
  fee_currency?: string,
  fee_amount?: number,
  title?: string,
  description?: string,
  author?: string,
  tags?: Array<string>,
  language?: Array<string>,
  locations?: Array<string>,
  license?: string,
  license_url?: string,
  thumbnail_url?: string,
  release_time?: number,
  channel_id?: string,
  channel_name?: string,
  preview?: boolean,
  blocking?: boolean,
};

// Redux slice. Includes both form data and some UI states
declare type PublishState = {|
  type: PublishType;
  liveCreateType: LiveCreateType,
  liveEditType: LiveEditType,
  uri?: ?string, // An edit's uri that is presented to the user. (TODO: remove this)
  editingURI: ?string, // An edit's uri with full info (claim id and all).
  claimToEdit: ?StreamClaim, // A copy of the claim being edited for reference.
                             // We want this because reducers can't access other
                             // slices to find the claim through editingURI.
                             // We can eventually remove editingURI and just
                             // derive that from a selector.
  fileText: ?string,
  filePath: ?string | WebFile,
  remoteFileUrl: ?string,
  paywall: Paywall,
  fileDur: number,
  fileSize: number,
  fileVid: boolean,
  fileMime: string,
  fileBitrate: number,
  fileSizeTooBig: boolean,
  streamType: ?string,
  fee: {
    amount: number,
    currency: string,
  },
  fiatPurchaseFee: Price,
  fiatPurchaseEnabled: boolean,
  fiatRentalFee: Price,
  fiatRentalExpiration: Duration,
  fiatRentalEnabled: boolean,
  memberRestrictionOn: boolean,
  memberRestrictionTierIds: Array<number>,
  title: string,
  thumbnail: string, // Manually-entered thumbnail url.
  thumbnail_url: string, // URL for successful thumbnail upload.
  thumbnailPath: string, // File path for the thumbnail that will be uploaded.
  uploadThumbnailStatus: string,
  thumbnailError: ?boolean,
  description: string,
  language: string,
  releaseTime: ?number, // The user-entered value, whether valid or not. The UI
                        // can gray out for some scenarios, but value should be
                        // retained for un-graying. @see PAYLOAD.releaseTime()
                        // for full logic for "undefined".
  releaseTimeDisabled: boolean, // Indicates that the user's setting will have
                                // no effect in the current scenario (grayed out)
  releaseTimeError: ?string,
  nsfw: boolean,
  channel: string,
  channelId: ?string,
  channelClaimId: ?ChannelId, // TODO: figure out why channelId isn't used instead
  name: string,
  nameError: ?string,
  bid: number,
  bidError: ?string,
  licenseType: ?string,
  otherLicenseDescription: string,
  licenseUrl: string,
  tags: Array<{ name: string }>,
  publishing: boolean,
  publishSuccess: boolean,
  publishError: ?boolean,
  optimize: boolean,
  useLBRYUploader: boolean,
  currentUploads: { [guid: string]: FileUploadItem },
  visibility: Visibility,
  scheduledShow: boolean,
|};

// Redux slice, optional version. Used to selectively update certain states.
declare type UpdatePublishState = $Shape<PublishState>;

declare type DoUpdatePublishForm = {
  type: 'UPDATE_PUBLISH_FORM', // ACTIONS.UPDATE_PUBLISH_FORM,
  data: UpdatePublishState,
};

declare type MemberRestrictionStatus = {|
  // -- Main --
  isApplicable: boolean, // Whether members-only is applicable to the current state of the Publish form
  isSelectionValid: boolean, // Whether the current settings should flag a user-error.
  isRestricting: boolean, // Whether restrictions is going to be applied when the form is sent.
  // -- Supporting details --
  details: {|
    isUnlisted: boolean,
    isAnonymous: boolean,
    hasTiers: boolean,
    hasTiersWithRestrictions: boolean,
  |},
|};

declare type TusUploader = any;

declare type FileUploadSdkParams = {
  file_path: string | File,
  claim_id: ?string,
  name: ?string,
  preview?: boolean,
  remote_url?: string,
  thumbnail_url?: string,
  title?: string,
  // Temporary values; remove when passing to SDK
  guid: string,
  uploadUrl?: string,
  sdkRan?: boolean,
  isMarkdown: boolean,
  channel_id: ?string,
};

declare type UploadStatus =
  'error' | // General failure.
  'retry' | // tus is retrying the upload.
  'notify_ok' | // SDK request sent without network errors. SDK result needs to be queried.
  'notify_failed' | // SDK request met an API error (not SDK error).
  'conflict'; // Trying to upload from multiple tabs.

declare type FileUploadItem = {
  params: FileUploadSdkParams,
  file: File,
  fileFingerprint: string,
  progress: string,
  status?: UploadStatus,
  sdkRan?: boolean,
  uploader?: TusUploader | XMLHttpRequest,
  resumable: boolean,
};
