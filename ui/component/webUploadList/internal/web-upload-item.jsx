// @flow
import React, { useState } from 'react';
import BusyIndicator from 'component/common/busy-indicator';
import FileSelector from 'component/common/file-selector';
import Button from 'component/button';
import FileThumbnail from 'component/fileThumbnail';
import * as MODALS from 'constants/modal_types';
import { serializeFileObj } from 'util/file';
import { tusIsSessionLocked } from 'util/tus';

type Props = {
  uploadItem: FileUploadItem,
  doPublishResume: (any) => void,
  doUpdateUploadRemove: (string, any) => void,
  doOpenModal: (string, {}) => void,
};

export default function WebUploadItem(props: Props) {
  const { uploadItem, doPublishResume, doUpdateUploadRemove, doOpenModal } = props;
  const { params, file, fileFingerprint, progress, status, sdkRan, resumable, uploader } = uploadItem;

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const locked = tusIsSessionLocked(params.guid);

  function handleFileChange(newFile: WebFile, clearName = true) {
    if (serializeFileObj(newFile) === fileFingerprint) {
      setShowFileSelector(false);
      doPublishResume({ ...params, file_path: newFile });
      if (!params.guid) {
        // Can remove this if-block after January 2022.
        doUpdateUploadRemove('', params);
      }
    } else {
      doOpenModal(MODALS.CONFIRM, {
        title: __('Invalid file'),
        subtitle: __('It appears to be a different or modified file.'),
        body: <p className="help--warning">{__('Please select the same file from the initial upload.')}</p>,
        onConfirm: (closeModal) => closeModal(),
        hideCancel: true,
      });
    }
  }

  function handleCancel() {
    doOpenModal(MODALS.CONFIRM, {
      title: __('Cancel upload'),
      subtitle: __('Cancel and remove the selected upload?'),
      body: params.name ? (
        <>
          <div className="section section--padded border-std non-clickable">
            <p className="empty">{`lbry://${params.name}`}</p>
          </div>
          <div className="section section__subtitle">
            <p>
              {__(
                'If the file has been fully uploaded and already being processed, it might still appear in your Uploads list later.'
              )}
            </p>
          </div>
        </>
      ) : undefined,
      onConfirm: (closeModal) => {
        if (tusIsSessionLocked(params.guid)) {
          // Corner-case: it's possible for the upload to resume in another tab
          // after the modal has appeared. Make a final lock-check here.
          // We can invoke a toast here, but just do nothing for now.
          // The upload status should make things obvious.
        } else {
          if (uploader) {
            if (resumable) {
              // $FlowFixMe - couldn't resolve to TusUploader manually.
              uploader.abort(true); // TUS
            } else {
              uploader.abort(); // XHR
            }
          }

          // The second parameter (params) can be removed after January 2022.
          doUpdateUploadRemove(params.guid, params);
        }
        closeModal();
      },
    });
  }

  function getProgressElem() {
    if (locked) {
      return __('File being uploaded in another tab or window.');
    }

    if (!uploader) {
      if (status === 'notify_ok') {
        if (isCheckingStatus) {
          return <BusyIndicator message={__('Still processing, please be patient...')} />;
        } else {
          return __('File uploaded to server.');
        }
      } else {
        return __('Stopped.');
      }
    }

    if (resumable) {
      if (status) {
        switch (status) {
          case 'retry':
            return __('Uploading...');
          case 'error':
            return __('Failed.');
          case 'conflict':
            return __('Stopped. Duplicate session detected.');
          case 'notify_ok':
            return <BusyIndicator message={__('Processing file. Please wait...')} />;
          default:
            return status;
        }
      } else {
        const progressInt = parseInt(progress);
        return progressInt === 100 ? __('Processing...') : `${__('Uploading...')} (${progressInt}%)`;
      }
    } else {
      return __('Uploading...');
    }
  }

  function getRetryButton() {
    if (!resumable || locked) {
      return null;
    }

    if (uploader) {
      // Should still be uploading. Don't show.
      return null;
    } else {
      // Refreshed or connection broken ...

      if (sdkRan) {
        // ... '/notify' was already sent and known to be successful. We just
        // need to resume from the '/status' query stage.
        return (
          <Button
            label={__('Check Status')}
            button="link"
            onClick={() => {
              setIsCheckingStatus(true);
              doPublishResume({ ...params, sdkRan });
            }}
          />
        );
      }

      let isFileActive = file instanceof File;
      // #631: There are logs showing that some users can't resume no matter how
      // many times they tried, which seems to indicate the net::ERR_UPLOAD_FILE_CHANGED
      // problem. Since we can't programmatically detect this scenario, always
      // assume so and ask the user to re-select the file.
      isFileActive = false;

      return (
        <Button
          label={isFileActive ? __('Resume') : __('Retry')}
          button="link"
          onClick={() => {
            if (isFileActive) {
              doPublishResume({ ...params, file_path: file });
            } else {
              setShowFileSelector(true);
            }
          }}
          disabled={showFileSelector}
        />
      );
    }
  }

  function getCancelButton() {
    if (!locked) {
      if (resumable) {
        if (sdkRan && status === 'error') {
          return <Button label={__('Remove')} button="link" onClick={handleCancel} />;
        }

        // @if TARGET='DISABLE_FOR_NOW'
        // (Just let the user cancel if they want now)
        if (parseInt(progress) === 100) {
          return null;
        }
        // @endif
      }

      return <Button label={__('Cancel')} button="link" onClick={handleCancel} />;
    }
  }

  function getFileSelector() {
    return (
      <div className="claim-preview--padded">
        <FileSelector
          label={__('File')}
          onFileChosen={handleFileChange}
          // https://stackoverflow.com/questions/19107685/safari-input-type-file-accept-video-ignores-mp4-files
          placeholder={__('Select the file to resume upload...')}
        />
      </div>
    );
  }

  function getProgressBar() {
    return (
      <>
        <div className="claim-upload__progress--label">lbry://{params.name}</div>
        <div className={'claim-upload__progress--outer card--inline'}>
          <div className={'claim-upload__progress--inner'} style={{ width: `${progress}%` }}>
            <span className="claim-upload__progress--inner-text">{getProgressElem()}</span>
          </div>
        </div>
      </>
    );
  }

  React.useEffect(() => {
    if (locked && showFileSelector) {
      setShowFileSelector(false);
    }
  }, [locked, showFileSelector]);

  return (
    <li className={'web-upload-item claim-preview claim-preview--inactive card--inline'}>
      <FileThumbnail thumbnail={params.thumbnail_url} />
      <div className={'claim-preview-metadata'}>
        <div className="claim-preview-info">
          <div className="claim-preview__title">{params.title}</div>
          <div className="card__actions--inline">
            {getRetryButton()}
            {getCancelButton()}
          </div>
        </div>
        {showFileSelector && getFileSelector()}
        {!showFileSelector && getProgressBar()}
      </div>
    </li>
  );
}
