// @flow

declare type Paywall = 'free' | 'fiat' | 'sdk';

// SDK
declare type PublishParams = {
  name: ?string,
  bid: ?number,
  filePath?: string,
  description: ?string,
  language: string,
  publishingLicense?: string,
  publishingLicenseUrl?: string,
  thumbnail: ?string,
  channel: string,
  channelId?: string,
  title: string,
  paywall: Paywall,
  uri?: string,
  license: ?string,
  licenseUrl: ?string,
  fee?: {
    amount: string,
    currency: string,
  },
  claim: StreamClaim,
  nsfw: boolean,
  tags: Array<Tag>,
};

// Redux slice. Includes both form data and some UI states
declare type PublishState = {
  editingURI: ?string,
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
  releaseTime: ?number,
  releaseTimeEdited: ?number,
  releaseAnytime: boolean,
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
};

// Redux slice, optional version. Used to selectively update certains states.
declare type UpdatePublishState = $Shape<PublishState>;

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
