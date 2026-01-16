// @flow
import React from 'react';
import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { isNameValid } from 'util/lbryURI';
import { INVALID_NAME_ERROR } from 'constants/claim';
import { BITRATE } from 'constants/publish';

type Props = {
  waitForFile: boolean,
  // --- redux ---
  title: ?string,
  name: ?string,
  bid: ?string,
  bidError: ?string,
  editingURI: ?string,
  filePath: ?string | WebFile,
  fileBitrate: number,
  fileSizeTooBig: boolean,
  isStillEditing: boolean,
  uploadThumbnailStatus: string,
  thumbnail: string,
  thumbnailError: boolean,
  releaseTimeError: ?string,
  memberRestrictionStatus: MemberRestrictionStatus,
};

function PublishFormErrors(props: Props) {
  const {
    name,
    title,
    bid,
    bidError,
    editingURI,
    filePath,
    isStillEditing,
    uploadThumbnailStatus,
    thumbnail,
    thumbnailError,
    releaseTimeError,
    memberRestrictionStatus,
    waitForFile,
    fileBitrate,
    fileSizeTooBig,
  } = props;
  // These are extra help
  // If there is an error it will be presented as an inline error as well

  const isUploadingThumbnail = uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const missingTiers = memberRestrictionStatus.isApplicable && !memberRestrictionStatus.isSelectionValid;

  const UPLOAD_SIZE_MESSAGE = __('%SITE_NAME% uploads are limited to %limit% GB.', {
    SITE_NAME,
    limit: WEB_PUBLISH_SIZE_LIMIT_GB,
  });

  return (
    <div className="error__text">
      {waitForFile && <div>{__('Choose a replay file, or select None')}</div>}
      {missingTiers && <div>{__(HELP.NO_TIERS_SELECTED)}</div>}
      {fileSizeTooBig && <div>{UPLOAD_SIZE_MESSAGE}</div>}
      {fileBitrate > BITRATE.MAX && (
        <div>{__('Bitrate is over the max, please transcode or choose another file.')}</div>
      )}
      {!title && <div>{__('A title is required')}</div>}
      {!name && <div>{__('A URL is required')}</div>}
      {name && !isNameValid(name) && INVALID_NAME_ERROR}
      {!bid && <div>{__('A deposit amount is required')}</div>}
      {bidError && <div>{__('Please check your deposit amount.')}</div>}
      {isUploadingThumbnail && <div>{__('Please wait for thumbnail to finish uploading')}</div>}
      {!isUploadingThumbnail && !thumbnail ? (
        <div>{__('A thumbnail is required. Please upload or provide an image URL above.')}</div>
      ) : (
        thumbnailError && !thumbnailUploaded && <div>{__('Thumbnail is invalid.')}</div>
      )}
      {editingURI && !isStillEditing && !filePath && <div>{__('Please reselect a file after changing the URL')}</div>}
      {releaseTimeError && <div>{__(releaseTimeError)}</div>}
    </div>
  );
}

// prettier-ignore
const HELP = {
  NO_TIERS_SELECTED: "You selected to restrict this content but didn't choose any memberships, please choose a membership tier to restrict, or uncheck the restriction box",
};

export default PublishFormErrors;
