import React from 'react';
import { Modal } from 'modal/modal';
import { DOMAIN } from 'config';
import ThumbnailBrokenImage from 'component/selectThumbnail/thumbnail-broken.png';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import { doUploadThumbnail, doUpdatePublishForm } from 'redux/actions/publish';
import './style.scss';
// ****************************************************************************
// ****************************************************************************
export type Props = {
  file: WebFile;
  cb: (arg0: string) => void;
};

// ****************************************************************************
// ****************************************************************************
function ModalConfirmThumbnailUpload(props: Props) {
  const { file, cb } = props;
  const dispatch = useAppDispatch();
  const filePath = file && (file.path || file.name);
  const [imageSrc, setImageSrc] = React.useState('');

  function handleConfirmed() {
    if (file) {
      dispatch(doUploadThumbnail('', file, null, null, file.path, cb));
      dispatch(
        doUpdatePublishForm({
          thumbnailPath: file.path,
        })
      );
      dispatch(doHideModal());
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
      onAborted={() => dispatch(doHideModal())}
    >
      <label>
        {__('Are you sure you want to upload this thumbnail to %domain%', {
          domain: DOMAIN,
        })}
        ?
      </label>
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
