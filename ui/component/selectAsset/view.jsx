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
import * as ICONS from 'constants/icons';
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

  function doUploadAsset() {
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
    data.append('file-input', fileSelected);
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
      <div className="channel-preview-wrapper">
        <div
          className="channel-preview-header"
          style={{
            backgroundImage:
              'url(' + (assetName === 'Cover Image' ? String(currentPlaceholder) : String(otherValue)) + ')',
          }}
        />
        <div className="channel-preview-tabs" />
        <div className="channel-preview-thumbnail">
          {otherValue && <img src={assetName === 'Cover Image' ? String(otherValue) : String(currentPlaceholder)} />}
        </div>
        <div className="channel-preview-grid">
          {Array.from(Array(6), (e, i) => {
            return (
              <div className="channel-preview-grid-tile" key={i}>
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
                <div className="preview-image-wrapper">
                  <div className="preview-image-container">
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
                <div className="preview-image-wrapper">
                  <div className="preview-image-container">
                    {currentPlaceholder ? (
                      <img className="preview-image" src={String(currentPlaceholder)} />
                    ) : (
                      <Icon icon={ICONS.IMAGE} />
                    )}
                  </div>
                </div>
              </div>
            )}
            {(assetName === 'Cover Image' || assetName === 'Thumbnail') && <ChannelPreview />}
          </>
        )}
      </fieldset-section>

      <div className="section__actions">
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
        <FormField
          name="toggle-upload"
          type="checkbox"
          label={__('Use a URL')}
          checked={useUrl}
          onChange={() => setUseUrl(!useUrl)}
        />
      </div>
    </>
  );

  if (inline) {
    return <fieldset-section>{formBody}</fieldset-section>;
  }

  return (
    <Card
      title={title || __('Choose %asset%', { asset: __(`${assetName}`) })}
      actions={<Form onSubmit={onDone}>{formBody}</Form>}
    />
  );
}

export default SelectAsset;
