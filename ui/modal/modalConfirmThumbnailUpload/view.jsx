// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import { DOMAIN } from 'config';

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

  function handleConfirmed() {
    if (file) {
      upload(file, cb);
      updatePublishForm({ thumbnailPath: file.path });
      closeModal();
    }
  }

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

      <blockquote>{filePath}</blockquote>
    </Modal>
  );
}

export default ModalConfirmThumbnailUpload;
