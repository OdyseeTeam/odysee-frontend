import React from 'react';
import { Modal } from 'modal/modal';
import { FormField } from 'component/common/form';
import ThumbnailBrokenImage from 'component/selectThumbnail/thumbnail-broken.png';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import { doUpdatePublishForm } from 'redux/actions/publish';
import '../modalConfirmThumbnailUpload/style.scss';

export type Props = {
  cb: (url: string) => void;
};

export default function ModalConfirmThumbnailUrl(props: Props) {
  const { cb } = props;
  const dispatch = useAppDispatch();
  const [url, setUrl] = React.useState('');
  const [previewError, setPreviewError] = React.useState(false);

  function handleConfirmed() {
    const trimmed = url.trim();
    if (trimmed) {
      dispatch(doUpdatePublishForm({ thumbnail: trimmed, thumbnailError: false }));
      cb(trimmed);
      dispatch(doHideModal());
    }
  }

  return (
    <Modal
      isOpen
      title={__('Thumbnail URL')}
      contentLabel={__('Confirm Thumbnail URL')}
      type="confirm"
      confirmButtonLabel={__('Use this URL')}
      confirmButtonDisabled={!url.trim() || previewError}
      onConfirmed={handleConfirmed}
      onAborted={() => dispatch(doHideModal())}
    >
      <FormField
        type="text"
        name="thumbnail_url_input"
        placeholder="https://example.com/thumbnail.jpg"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setPreviewError(false);
        }}
        autoFocus
      />
      {url.trim() && (
        <div className="upload-thumbnail-preview">
          <img
            className="upload-thumbnail-preview__image"
            src={previewError ? ThumbnailBrokenImage : url.trim()}
            alt={__('Thumbnail Preview')}
            onError={() => setPreviewError(true)}
            onLoad={() => setPreviewError(false)}
          />
        </div>
      )}
    </Modal>
  );
}
