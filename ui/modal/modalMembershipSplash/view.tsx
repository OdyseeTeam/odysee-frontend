import React from 'react';
import { Modal } from 'modal/modal';
import MembershipSplash from 'component/membershipSplash';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
  claimIsMine: boolean;
  isSupport: boolean;
};

function ModalMembershipSplash(props: Props) {
  const { uri, claimIsMine } = props;
  const dispatch = useAppDispatch();

  const closeModal = () => dispatch(doHideModal());

  return (
    <Modal onAborted={closeModal} isOpen type="card" width="wide">
      <MembershipSplash uri={uri} claimIsMine={claimIsMine} onCancel={closeModal} />
    </Modal>
  );
}

export default ModalMembershipSplash;
