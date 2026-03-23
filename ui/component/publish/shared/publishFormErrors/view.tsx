import React from 'react';
import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { isNameValid } from 'util/lbryURI';
import { INVALID_NAME_ERROR } from 'constants/claim';
import { BITRATE } from 'constants/publish';
import { useAppSelector } from 'redux/hooks';
import {
  selectPublishFormValue,
  selectIsStillEditing,
  selectMemberRestrictionStatus,
  selectPrevFileSizeTooBig,
} from 'redux/selectors/publish';
type Props = {
  waitForFile: boolean;
  missingRequiredFile?: boolean;
  title?: string | null | undefined;
  mode?: string;
};

function PublishFormErrors(props: Props) {
  const { waitForFile, missingRequiredFile } = props;
  const bid = useAppSelector((state) => selectPublishFormValue(state, 'bid'));
  const name = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const title = useAppSelector((state) => selectPublishFormValue(state, 'title'));
  const bidError = useAppSelector((state) => selectPublishFormValue(state, 'bidError'));
  const fileBitrate = useAppSelector((state) => selectPublishFormValue(state, 'fileBitrate'));
  const fileSizeTooBig = useAppSelector((state) => selectPublishFormValue(state, 'fileSizeTooBig'));
  const editingURI = useAppSelector((state) => selectPublishFormValue(state, 'editingURI'));
  const uploadThumbnailStatus = useAppSelector((state) => selectPublishFormValue(state, 'uploadThumbnailStatus'));
  const thumbnail = useAppSelector((state) => selectPublishFormValue(state, 'thumbnail'));
  const thumbnailError = useAppSelector((state) => selectPublishFormValue(state, 'thumbnailError'));
  const releaseTimeError = useAppSelector((state) => selectPublishFormValue(state, 'releaseTimeError'));
  const memberRestrictionStatus = useAppSelector((state) => selectMemberRestrictionStatus(state));
  const isStillEditing = useAppSelector((state) => selectIsStillEditing(state));
  const prevFileSizeTooBig = useAppSelector((state) => selectPrevFileSizeTooBig(state));
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
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
      {missingRequiredFile && <div>{__('Choose a file to upload')}</div>}
      {missingTiers && <div>{__(HELP.NO_TIERS_SELECTED)}</div>}
      {fileSizeTooBig && !(isStillEditing && prevFileSizeTooBig) && <div>{UPLOAD_SIZE_MESSAGE}</div>}
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
  NO_TIERS_SELECTED: "You selected to restrict this content but didn't choose any memberships, please choose a membership tier to restrict, or uncheck the restriction box"
};
export default PublishFormErrors;
