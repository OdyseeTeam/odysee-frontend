import React from 'react';
import { Modal } from 'modal/modal';
import SendTip from 'component/walletSendTip';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
  claimIsMine: boolean;
  isSupport: boolean;
  isTipOnly?: boolean;
  hasSelectedTab?: string;
  customText?: string;
  setAmount?: (arg0: number) => void;
};

function ModalSendTip(props: Props) {
  const { uri, claimIsMine, isTipOnly, hasSelectedTab, customText, setAmount } = props;
  const dispatch = useAppDispatch();

  const hideModal = () => dispatch(doHideModal());

  return (
    <Modal onAborted={hideModal} isOpen type="card">
      <SendTip
        uri={uri}
        claimIsMine={claimIsMine}
        onCancel={hideModal}
        isTipOnly={isTipOnly}
        hasSelectedTab={hasSelectedTab}
        customText={customText}
        setAmount={setAmount}
        modalProps={props}
      />
    </Modal>
  );
}

export default ModalSendTip;
