import React from 'react';
import { Modal } from 'modal/modal';
import SyncToggleFlow from 'component/syncEnableFlow';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
type Props = {
  mode: string;
};

const ModalSyncEnable = (props: Props) => {
  const { mode } = props;
  const dispatch = useAppDispatch();
  const closeModal = () => dispatch(doHideModal());
  return (
    <Modal isOpen type="card" onAborted={closeModal}>
      <SyncToggleFlow closeModal={closeModal} mode={mode} />
    </Modal>
  );
};

export default ModalSyncEnable;
