/**
 * Publish / upload types.
 */

type PublishType = 'file' | 'post' | 'livestream';

type PublishState = {
  editingURI?: string;
  filePath?: string | WebFile;
  remoteFileUrl?: string;
  contentIsFree: boolean;
  fee: { amount: number; currency: string };
  title: string;
  thumbnail_url: string;
  thumbnailPath?: string;
  uploadThumbnailStatus: string;
  thumbnail?: string;
  description: string;
  language: string;
  releaseTime?: number;
  releaseAnytime?: boolean;
  channel?: string;
  channelId?: string;
  name: string;
  nameError?: string;
  bid: number;
  bidError?: string;
  otherLicenseDescription: string;
  licenseUrl: string;
  licenseType: string;
  uri?: string;
  nsfw: boolean;
  tags: Array<Tag>;
  optimize: boolean;
  useLBRYUploader: boolean;
  publishType: PublishType;
  [key: string]: any;
};

type UpdatePublishState = Partial<PublishState>;

type WebFile = {
  name?: string;
  path?: string;
  size?: number;
  type?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  [key: string]: any;
};

type FileUploadSdkParams = {
  name: string;
  title?: string;
  bid: string;
  file_path?: string;
  channel_id?: string;
  [key: string]: any;
};

type FileUploadItem = {
  params: FileUploadSdkParams;
  file: File;
  resumable?: boolean;
  publishId?: string;
  [key: string]: any;
};

type UploadTemplate = {
  name: string;
  title?: string;
  description?: string;
  bid?: string;
  thumbnail_url?: string;
  tags?: Array<string>;
  languages?: Array<string>;
  channel_id?: string;
  channel_name?: string;
  release_time?: number;
  license?: string;
  license_url?: string;
  [key: string]: any;
};

type UploadTemplateData = UploadTemplate;

type UploadStatus = {
  progress?: number;
  status?: string;
  error?: string;
};

type UploadBackendVersion = 'v3' | 'v4';

type TusUploader = {
  abort: () => void;
  [key: string]: any;
};

type FileListItem = {
  claim_id: string;
  claim_name: string;
  outpoint: string;
  download_path?: string;
  streaming_url?: string;
  metadata?: StreamMetadata;
  file_name?: string;
  written_bytes?: number;
  total_bytes?: number;
  completed: boolean;
  status: string;
  [key: string]: any;
};
