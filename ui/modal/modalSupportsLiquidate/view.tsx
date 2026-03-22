import React from 'react';
import { Modal } from 'modal/modal';
import SupportsLiquidate from 'component/supportsLiquidate';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
};

export default function ModalSupportsLiquidate(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const closeModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);

  return (
    <Modal isOpen contentLabel={'Unlock tips'} type="card" confirmButtonLabel="done" onAborted={closeModal}>
      <SupportsLiquidate uri={uri} handleClose={closeModal} />
    </Modal>
  );
}
