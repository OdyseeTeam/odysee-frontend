// @flow
import React from 'react';
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
  isStillEditing: boolean,
  uploadThumbnailStatus: string,
  thumbnail: string,
  thumbnailError: boolean,
  releaseTimeError: ?string,
  restrictedToMemberships: ?string,
  visibility: Visibility,
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
    waitForFile,
    fileBitrate,
    restrictedToMemberships,
    visibility,
  } = props;
  // These are extra help
  // If there is an error it will be presented as an inline error as well

  const isUploadingThumbnail = uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;

  return (
    <div className="error__text">
      {waitForFile && <div>{__('Choose a replay file, or select None')}</div>}
      {visibility !== 'unlisted' && restrictedToMemberships === null && (
        <div>
          {__(
            "You selected to restrict this content but didn't choose any memberships, please choose a membership tier to restrict, or uncheck the restriction box"
          )}
        </div>
      )}
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

export default PublishFormErrors;
