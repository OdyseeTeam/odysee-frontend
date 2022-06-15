// @flow
import React from 'react';
import ClaimCollectionAdd from 'component/claimCollectionAdd';
import { Modal } from 'modal/modal';

type Props = {
  doHideModal: () => void,
  uri: string,
  onlyCreate?: boolean,
};

const ModalClaimCollectionAdd = (props: Props) => {
  const { doHideModal, uri, onlyCreate } = props;
  return (
    <Modal isOpen type="card" onAborted={doHideModal}>
      <ClaimCollectionAdd uri={uri} closeModal={doHideModal} onlyCreate={onlyCreate} />
    </Modal>
  );
};
export default ModalClaimCollectionAdd;
