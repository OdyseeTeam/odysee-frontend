import React from 'react';
import ClaimCollectionAdd from './internal/claimCollectionAdd';
import { Modal } from 'modal/modal';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
type Props = {
  uri: string;
};

const ModalClaimCollectionAdd = (props: Props) => {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const hideModal = () => dispatch(doHideModal());
  return (
    <Modal isOpen type="card" onAborted={hideModal}>
      <ClaimCollectionAdd uri={uri} closeModal={hideModal} />
    </Modal>
  );
};

export default ModalClaimCollectionAdd;
