// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import { DOMAIN } from 'config';
import ThumbnailBrokenImage from 'component/selectThumbnail/thumbnail-broken.png';
import './style.scss';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  file: WebFile,
  cb: (string) => void,
|};

type StateProps = {||};

type DispatchProps = {|
  closeModal: () => void,
  upload: (WebFile, (string) => void) => void,
  updatePublishForm: (UpdatePublishState) => void,
|};

// ****************************************************************************
// ****************************************************************************

function ModalConfirmThumbnailUpload(props: Props & StateProps & DispatchProps) {
  const { file, cb, closeModal, upload, updatePublishForm } = props;
  const filePath = file && (file.path || file.name);
  const [imageSrc, setImageSrc] = React.useState('');

  function handleConfirmed() {
    if (file) {
      upload(file, cb);
      updatePublishForm({ thumbnailPath: file.path });
      closeModal();
    }
  }

  React.useEffect(() => {
    const imgSrc = URL.createObjectURL(file);
    setImageSrc(imgSrc);
    return () => {
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [file]);

  return (
    <Modal
      isOpen
      title={__('Upload thumbnail')}
      contentLabel={__('Confirm Thumbnail Upload')}
      type="confirm"
      confirmButtonLabel={__('Upload')}
      onConfirmed={handleConfirmed}
      onAborted={closeModal}
    >
      <label>{__('Are you sure you want to upload this thumbnail to %domain%', { domain: DOMAIN })}?</label>
      <div className="upload-thumbnail-preview">
        <img
          className="upload-thumbnail-preview__image"
          src={imageSrc || ThumbnailBrokenImage}
          alt={__('Thumbnail Preview')}
          onError={() => setImageSrc('')}
        />
        <div className="upload-thumbnail-preview__filename">{filePath}</div>
      </div>
    </Modal>
  );
}

export default ModalConfirmThumbnailUpload;
