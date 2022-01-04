// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import { formatFileSystemPath } from 'util/url';

type Props = {
  uri: string,
  isTrusted: boolean,
  path: string,
  isMine: boolean,
  closeModal: () => void,
};

function ModalOpenExternalResource(props: Props) {
  const { uri, isTrusted, path, isMine, closeModal } = props;

  if ((uri && isTrusted) || (path && isMine)) {
    openResource();
  }

  function openResource() {
    if (uri) {
      window.open(uri);
    } else if (path) {
      window.open(formatFileSystemPath(path));
    }

    closeModal();
  }

  return (
    <Modal
      isOpen
      title={__('Warning!')}
      contentLabel={__('Confirm External Resource')}
      type="confirm"
      confirmButtonLabel={__('Continue')}
      onConfirmed={() => openResource()}
      onAborted={closeModal}
    >
      <p>
        {(uri && __('This link leads to an external website.')) ||
          (path && __('This file has been shared with you by other people.'))}
      </p>
      <blockquote>{uri || path}</blockquote>
      <p>{__('Odysee is not responsible for its content, click continue to proceed at your own risk.')}</p>
    </Modal>
  );
}

export default ModalOpenExternalResource;
