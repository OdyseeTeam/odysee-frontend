import * as MODALS from 'constants/modal_types';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { DOMAIN, THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import * as React from 'react';
import { FormField } from 'component/common/form';
import FileSelector from 'component/common/file-selector';
import Button from 'component/button';
import Spinner from 'component/spinner';
import ThumbnailMissingImage from './thumbnail-missing.png';
import ThumbnailBrokenImage from './thumbnail-broken.png';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValues } from 'redux/selectors/publish';
import { doUpdatePublishForm, doResetThumbnailStatus } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
import { lazyImport } from 'util/lazyImport';
import './style.lazy.scss';

const ThumbnailPicker = lazyImport(() => import('component/thumbnailPicker'));
type Props = {
  thumbnailParam?: string | null | undefined;
  thumbnailParamError?: boolean;
  thumbnailParamStatus?: string;
  optional?: boolean;
  updateThumbnailParams?: (arg0: {}) => void;
};

function SelectThumbnail(props: Props) {
  const { thumbnailParam, thumbnailParamStatus, updateThumbnailParams, optional } = props;

  const dispatch = useAppDispatch();
  const publishFormValues = useAppSelector(selectPublishFormValues);
  const {
    filePath,
    thumbnail: publishThumbnail,
    formDisabled,
    uploadThumbnailStatus: status,
    thumbnailPath,
    thumbnailError: publishThumbnailError,
  } = publishFormValues;
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const resetThumbnailStatus = () => dispatch(doResetThumbnailStatus());
  const openModal = (modal: string, modalProps: {}) => dispatch(doOpenModal(modal, modalProps));

  const publishForm = !updateThumbnailParams;
  const thumbnail = publishForm ? publishThumbnail : thumbnailParam;
  const thumbnailError = publishForm ? publishThumbnailError : props.thumbnailParamError;
  const accept = window.cordova ? 'image/*' : '.png, .jpg, .jpeg, .gif, .webp';
  const manualInput = status === THUMBNAIL_STATUSES.MANUAL;
  const thumbUploaded = status === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const isUrlInput = thumbnail !== ThumbnailMissingImage && thumbnail !== ThumbnailBrokenImage;
  const remoteFileUrl = publishFormValues.remoteFileUrl;
  const videoPickerFile = filePath instanceof File ? filePath : undefined;
  const isSupportedVideo = Boolean(videoPickerFile && videoPickerFile.type.split('/')[0] === 'video');
  const isSupportedImage = Boolean(videoPickerFile && videoPickerFile.type.split('/')[0] === 'image');
  const hasRemoteVideo = Boolean(!videoPickerFile && remoteFileUrl);
  const [showVideoPicker, setShowVideoPicker] = React.useState(isSupportedVideo);

  React.useEffect(() => {
    if (isSupportedVideo) setShowVideoPicker(true);
  }, [isSupportedVideo]);

  function handleThumbnailChange(e: any) {
    const newThumbnail = e.target.value.replace(' ', '');

    if (updateThumbnailParams) {
      updateThumbnailParams({
        thumbnail_url: newThumbnail,
      });
    } else {
      updatePublishForm({
        thumbnail: newThumbnail,
        thumbnailError: newThumbnail.startsWith('data:image'),
      });
    }
  }

  React.useEffect(() => {
    if (updateThumbnailParams && status !== thumbnailParamStatus) {
      updateThumbnailParams({
        thumbnail_status: status,
      });
    }
  }, [status, thumbnailParamStatus, updateThumbnailParams]);
  let thumbnailSrc;

  if (!thumbnail) {
    thumbnailSrc = ThumbnailMissingImage;
  } else if (thumbnailError) {
    thumbnailSrc =
      (manualInput && ThumbnailBrokenImage) || (status !== THUMBNAIL_STATUSES.COMPLETE && ThumbnailMissingImage);
  } else {
    thumbnailSrc = thumbnail;
  }

  /*
    Note:
    We are using backgroundImage instead of an <img /> to zoom if the selected thumbnail isn't
    the proper aspect ratio. This is to avoid blackbars on the side of images and inconsistent thumbnails
    We still need to render the image to see if there is an error loading the url
  */
  const thumbPreview = (
    <div
      className="column__item thumbnail-picker__preview"
      style={{
        backgroundImage: `url(${String(thumbnailSrc)})`,
      }}
    >
      {thumbUploaded &&
        thumbnailError !== false &&
        __('This will be visible in a few minutes after you submit this form.')}
      <img
        style={{
          display: 'none',
        }}
        src={thumbnail}
        alt={__('Thumbnail Preview')}
        onError={() =>
          publishForm
            ? updatePublishForm({
                thumbnailError: true,
              })
            : updateThumbnailParams({
                thumbnail_error: Boolean(thumbnail),
              })
        }
        onLoad={() =>
          publishForm
            ? updatePublishForm({
                thumbnailError: !isUrlInput || (thumbnail ? thumbnail.startsWith('data:image') : false),
              })
            : updateThumbnailParams({
                thumbnail_error: !isUrlInput,
              })
        }
      />
    </div>
  );
  if (publishForm || !updateThumbnailParams) {
    return (
      <React.Suspense
        fallback={
          <div className="main--empty empty">
            <Spinner type="small" />
          </div>
        }
      >
        <ThumbnailPicker
          filePath={videoPickerFile}
          hasVideo={isSupportedVideo || hasRemoteVideo}
          remoteVideoUrl={hasRemoteVideo ? remoteFileUrl : undefined}
          imageFile={isSupportedImage ? videoPickerFile : undefined}
        />
      </React.Suspense>
    );
  }

  return (
    <>
      {optional && <h2 className="card__title">{__('Thumbnail (Optional)')}</h2>}
      {status !== THUMBNAIL_STATUSES.IN_PROGRESS && (
        <div className="column card--thumbnail">
          {thumbPreview}
          <div className="column__item">
            {manualInput ? (
              <>
                <FormField
                  type="text"
                  name="content_thumbnail"
                  placeholder="https://images.fbi.gov/alien"
                  value={thumbnail}
                  disabled={formDisabled}
                  onChange={handleThumbnailChange}
                />
                {!thumbUploaded && <p className="help">{__('Enter a URL for your thumbnail.')}</p>}
              </>
            ) : (
              <>
                <FileSelector
                  currentPath={thumbnailPath}
                  placeholder={__('Choose an enticing thumbnail')}
                  accept={accept}
                  onFileChosen={(file) =>
                    openModal(MODALS.CONFIRM_THUMBNAIL_UPLOAD, {
                      file,
                      cb: (url) =>
                        updateThumbnailParams({
                          thumbnail_url: url,
                        }),
                    })
                  }
                />
                {!thumbUploaded && (
                  <p className="help">
                    {__('Upload your thumbnail to %domain%. Recommended ratio is 16:9, %max_size%MB max.', {
                      domain: DOMAIN,
                      max_size: THUMBNAIL_CDN_SIZE_LIMIT_BYTES / (1024 * 1024),
                    })}
                  </p>
                )}
              </>
            )}
            <div className="card__actions">
              <Button
                button="link"
                label={manualInput ? __('Use thumbnail upload tool') : __('Enter a thumbnail URL')}
                onClick={() =>
                  updatePublishForm({
                    uploadThumbnailStatus: manualInput ? THUMBNAIL_STATUSES.READY : THUMBNAIL_STATUSES.MANUAL,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {status === THUMBNAIL_STATUSES.IN_PROGRESS && (
        <div className="column card--thumbnail">
          <p>{__('Uploading thumbnail')}...</p>
        </div>
      )}
    </>
  );
}

export default SelectThumbnail;
