import React from 'react';
import { Modal } from 'modal/modal';
import PreorderAndPurchaseContentCard from './internal/preorderAndPurchaseContentCard';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
};

function ModalPreorderAndPurchaseContent(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();

  const hideModal = () => dispatch(doHideModal());

  return (
    <Modal onAborted={hideModal} ariaHideApp={false} isOpen type="card" width="wide">
      <PreorderAndPurchaseContentCard uri={uri} onCancel={hideModal} />
    </Modal>
  );
}

export default ModalPreorderAndPurchaseContent;
