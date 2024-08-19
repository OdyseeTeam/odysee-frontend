// @flow
import React from 'react';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import FileSelector from 'component/common/file-selector';
import { IMG_CDN_PUBLISH_URL } from 'constants/cdn_urls';
import { FormField, Form } from 'component/common/form';
import Button from 'component/button';
import Card from 'component/common/card';
import usePersistedState from 'effects/use-persisted-state';
import Icon from 'component/common/icon';
// $FlowIgnore
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import * as ICONS from 'constants/icons';
import 'react-image-crop/src/ReactCrop.scss';
import './style.scss';

const accept = '.png, .jpg, .jpeg, .gif, .webp';
const STATUS = { READY: 'READY', UPLOADING: 'UPLOADING' };

type Props = {
  assetName: string,
  currentValue: ?string,
  otherValue: ?string,
  onUpdate: (any, any) => void,
  recommended: string,
  title: string,
  onDone?: () => void,
  inline?: boolean,
};

function SelectAsset(props: Props) {
  const { onUpdate, onDone, assetName, currentValue, otherValue, recommended, title, inline } = props;
  const [pathSelected, setPathSelected] = React.useState('');
  const [fileSelected, setFileSelected] = React.useState<any>(null);
  const [uploadStatus, setUploadStatus] = React.useState(STATUS.READY);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const imgRef = React.useRef(null);
  const previewCanvasRef = React.useRef(null);

  const [cropInit, setCropInit] = React.useState(false);
  const [useUrl, setUseUrl] = usePersistedState('thumbnail-upload:mode', false);
  const [url, setUrl] = React.useState(currentValue);
  const [uploadErrorMsg, setUploadErrorMsg] = React.useState();
  const [imageTitle, setImageTitle] = React.useState();

  React.useEffect(() => {
    if (useUrl) {
      setUploadErrorMsg('');
      setFileSelected(null);
      setPathSelected('');
    }
  }, [useUrl]);

  React.useEffect(() => {
    if (fileSelected) {
      setCropInit(false);
    }
  }, [fileSelected]);

  async function canvasPreview(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop,
    scale = 1,
    rotate = 0
  ) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    const rotateRads = rotate * (Math.PI / 180);
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate(rotateRads);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);

    ctx.restore();
  }

  function useDebounceEffect(fn: () => void, waitTime: number, deps?: any) {
    React.useEffect(() => {
      const t = setTimeout(() => {
        fn.apply(undefined, deps);
      }, waitTime);

      return () => {
        clearTimeout(t);
      };
    }, [deps, fn, waitTime]);
  }

  useDebounceEffect(
    () => {
      const execute = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
          await canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
        }
      };

      execute();
    },
    100,
    [completedCrop]
  );

  async function doUploadAsset() {
    const uploadError = (error = '') => {
      setUploadErrorMsg(error);
    };

    const onSuccess = (thumbnailUrl) => {
      setUploadStatus(STATUS.READY);

      if (assetName !== 'Image') onUpdate(thumbnailUrl, !useUrl);
      else onUpdate(thumbnailUrl, imageTitle);

      if (onDone) {
        onDone();
      }
    };

    setUploadStatus(STATUS.UPLOADING);

    const data = new FormData();

    if (assetName === 'Cover Image' || assetName === 'Thumbnail') {
      try {
        const file = await processCanvas();
        if (file) {
          data.append('file-input', file);
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      data.append('file-input', fileSelected);
    }

    data.append('upload', 'Upload');

    return fetch(IMG_CDN_PUBLISH_URL, {
      method: 'POST',
      body: data,
    })
      .then((res) => res.text())
      .then((text) => {
        try {
          return text.length ? JSON.parse(text) : {};
        } catch {
          throw new Error(text);
        }
      })
      .then((json) => {
        return json.type === 'success'
          ? onSuccess(`${json.message}`)
          : uploadError(
              json.message || __('There was an error in the upload. The format or extension might not be supported.')
            );
      })
      .catch((err) => {
        uploadError(err.message);
        setUploadStatus(STATUS.READY);
      });
  }

  function processCanvas() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!image || !previewCanvas || !completedCrop) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = completedCrop.width * scaleX;
    offscreen.height = completedCrop.height * scaleY;

    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    return new Promise<File>((resolve, reject) => {
      offscreen.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'image.png', { type: 'image/png' }));
        } else {
          reject(new Error('Blob creation failed.'));
        }
      }, 'image/png');
    });
  }

  function onImageLoad(e) {
    const { offsetWidth: width, offsetHeight: height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 100,
        },
        assetName === 'Cover Image' ? 32 / 5 : 1,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
    const max = width > height ? height : width;
    setCompletedCrop({
      x: (width / 100) * crop.x,
      y: (100 / 100) * crop.y,
      unit: 'px',
      width: assetName === 'Cover Image' ? width : max,
      height: assetName === 'Cover Image' ? height : max,
    });
    setCropInit(true);
  }

  // Note for translators: e.g. "Thumbnail  (1:1)"
  const label = `${__(assetName)} ${__(recommended)}`;
  const selectFileLabel = __('Select File');
  const selectedLabel = pathSelected ? __('URL Selected') : __('File Selected');

  let fileSelectorLabel;
  if (uploadStatus === STATUS.UPLOADING) {
    fileSelectorLabel = __('Uploading...');
  } else {
    // Include the same label/recommendation for both 'URL' and 'UPLOAD'.
    fileSelectorLabel = `${label} ${fileSelected || pathSelected ? __(selectedLabel) : __(selectFileLabel)}`;
  }

  const currentPlaceholder = pathSelected ? imagePreview : currentValue;
  const ChannelPreview = () => {
    return (
      <div className="channel-preview__wrapper">
        <div
          className="channel-preview__header"
          style={{
            backgroundImage: 'url(' + (assetName === 'Thumbnail' ? String(otherValue) : '') + ')',
          }}
        >
          {assetName === 'Cover Image' && fileSelected && <canvas ref={previewCanvasRef} />}
        </div>
        <div className="channel-preview__tabs">
          <div>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="channel-preview__thumbnail">
          {otherValue && assetName === 'Cover Image' ? (
            <img src={String(otherValue)} />
          ) : (
            <canvas ref={previewCanvasRef} />
          )}
        </div>
        <div className="channel-preview__grid">
          {Array.from(Array(6), (e, i) => {
            return (
              <div className="channel-preview__grid-tile" key={i}>
                <div />
                <div />
                <div />
                <div />
                <div>
                  <div />
                  <div />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formBody = (
    <>
      <div className="modal_header">
        <Icon icon={ICONS.IMAGE} />
        <h2 className="modal_title">{title || __('Choose %asset%', { asset: __(`${assetName}`) })}</h2>
      </div>
      <fieldset-section>
        {uploadErrorMsg && <div className="error__text">{uploadErrorMsg}</div>}
        {useUrl ? (
          <>
            <FormField
              autoFocus
              type={'text'}
              name={'thumbnail'}
              label={label}
              placeholder={`https://example.com/image.png`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                assetName !== 'Image' && onUpdate(e.target.value, !useUrl);
              }}
            />
            {assetName === 'Image' && (
              <div className="image-upload-wrapper">
                <FormField
                  type={'text'}
                  name={'thumbnail'}
                  label={__('Title (optional)')}
                  placeholder={__('Describe your image...')}
                  value={imageTitle}
                  onChange={(e) => {
                    setImageTitle(e.target.value);
                  }}
                />
                <div className="preview-image__wrapper">
                  <div className="preview-image__container">
                    {url ? <img className="preview-image" src={String(url)} /> : <Icon icon={ICONS.IMAGE} />}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <FileSelector
              autoFocus
              disabled={uploadStatus === STATUS.UPLOADING}
              label={fileSelectorLabel}
              name="assetSelector"
              currentPath={pathSelected}
              onFileChosen={(file) => {
                if (file.name) {
                  setFileSelected(file);
                  // what why? why not target=WEB this?
                  // file.path is undefined in web but available in electron
                  setPathSelected(file.name || file.path);
                  setUploadErrorMsg('');
                  setImagePreview(URL.createObjectURL(file));

                  if (file.size >= THUMBNAIL_CDN_SIZE_LIMIT_BYTES) {
                    const maxSizeMB = THUMBNAIL_CDN_SIZE_LIMIT_BYTES / (1024 * 1024);
                    setUploadErrorMsg(
                      __('Thumbnail size over %max_size%MB, please edit and reupload.', { max_size: maxSizeMB })
                    );
                  }
                }
              }}
              accept={accept}
            />

            {assetName === 'Image' && (
              <div className="image-upload__wrapper">
                <FormField
                  type={'text'}
                  name={'thumbnail'}
                  label={__('Title (optional)')}
                  placeholder={__('Describe your image...')}
                  value={imageTitle}
                  onChange={(e) => {
                    setImageTitle(e.target.value);
                  }}
                />
                <div className="preview-image__wrapper">
                  <div className="preview-image__container">
                    {currentPlaceholder ? (
                      <img className="preview-image" src={String(currentPlaceholder)} />
                    ) : (
                      <Icon icon={ICONS.IMAGE} />
                    )}
                  </div>
                </div>
              </div>
            )}
            {(assetName === 'Cover Image' || assetName === 'Thumbnail') && (
              <>
                {fileSelected && (
                  <div className="cropCanvas">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={assetName === 'Cover Image' ? 32 / 5 : 1}
                      circularCrop={assetName === 'Thumbnail'}
                      minWidth={assetName === 'Cover Image' ? null : 160}
                      unit={'%'}
                    >
                      <img
                        ref={imgRef}
                        src={URL.createObjectURL(new Blob([fileSelected], { type: fileSelected.type }))}
                        onLoad={!cropInit ? onImageLoad : () => {}}
                      />
                    </ReactCrop>
                  </div>
                )}
                <ChannelPreview />
              </>
            )}
          </>
        )}
      </fieldset-section>

      <div className="section__actions upload-actions">
        <FormField
          className="toggle-upload-checkbox"
          name="toggle-upload"
          type="checkbox"
          label={__('Use a URL')}
          checked={useUrl}
          onChange={() => setUseUrl(!useUrl)}
        />
        {onDone && (
          <Button
            button="primary"
            type="submit"
            label={useUrl ? __('Done') : __('Upload')}
            disabled={
              !useUrl && (uploadStatus === STATUS.UPLOADING || !pathSelected || !fileSelected || uploadErrorMsg)
            }
            onClick={() => {
              if (!useUrl) {
                doUploadAsset();
              } else if (useUrl && assetName === 'Image') {
                onUpdate(url, imageTitle);
              }
            }}
          />
        )}
      </div>
    </>
  );

  if (inline) {
    return <fieldset-section>{formBody}</fieldset-section>;
  }

  return (
    <Card
      // title={title || __('Choose %asset%', { asset: __(`${assetName}`) })}
      actions={<Form onSubmit={onDone}>{formBody}</Form>}
    />
  );
}

export default SelectAsset;
