// @flow

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
declare type PublishState = {
  editingURI: ?string,
  // claimToEdit:
  //   A copy of the claim being edited for reference. We want this because
  //   reducers can't access other slices to find the claim through editingURI.
  //   We can eventually remove editingURI and just derive that in a selector.
  claimToEdit: ?StreamClaim,
  fileText: ?string,
  filePath: ?string,
  remoteFileUrl: ?string,
  paywall: Paywall,
  fileDur: number,
  fileSize: number,
  fileVid: boolean,
  fileMime: string,
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
  title: string,
  thumbnail_url: string,
  thumbnailPath: string,
  uploadThumbnailStatus: string,
  thumbnailError: ?boolean,
  description: string,
  language: string,
  // releaseTime:
  //   The user-entered value, whether valid or not. The UI can gray out for
  //   some scenarios, but value should be retained for un-graying.
  //   @see PUBLISH.releaseTime() for full logic for "undefined".
  releaseTime: ?number,
  // releaseTimeDisabled:
  //   Indicates that the user's setting will have no effect in the current
  //   scenario. Basically, gray it out.
  releaseTimeDisabled: boolean,
  releaseTimeError: ?string,
  channel: string,
  channelId: ?string,
  name: string,
  nameError: ?string,
  bid: number,
  bidError: ?string,
  otherLicenseDescription: string,
  licenseUrl: string,
  tags: Array<string>,
  optimize: boolean,
  useLBRYUploader: boolean,
  currentUploads: { [key: string]: FileUploadItem },
  isMarkdownPost: boolean,
  isLivestreamPublish: boolean,
  publishError?: boolean,
  replaySource: 'keep' | 'choose' | 'upload',
  visibility: Visibility,
  scheduledShow: boolean,
};

// Redux slice, optional version. Used to selectively update certains states.
declare type UpdatePublishState = $Shape<PublishState>;

declare type DoUpdatePublishForm = {
  type: 'UPDATE_PUBLISH_FORM', // ACTIONS.UPDATE_PUBLISH_FORM,
  data: UpdatePublishState,
};

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

declare type UploadStatus = 'error' | 'retry' | 'notify_ok' | 'notify_failed' | 'conflict';
// declare type PublishStage = '1_uploading' | '2_upload_done' | '3_sdk_publishing' | '4_skd_publish_done';

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
