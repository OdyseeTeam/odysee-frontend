// @flow
import React from 'react';
import PlaylistCreate from 'component/claimCollectionAdd';
import { Modal } from 'modal/modal';

type Props = {
  doHideModal: () => void,
};

const ModalPlaylistCreate = (props: Props) => {
  const { doHideModal } = props;

  return (
    <Modal isOpen type="card" onAborted={doHideModal}>
      <PlaylistCreate closeModal={doHideModal} />
    </Modal>
  );
};
export default ModalPlaylistCreate;
