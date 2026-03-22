import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembershipCard from 'component/joinMembershipCard';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = Record<string, never>;

function ModalJoinMembership(props: Props) {
  const dispatch = useAppDispatch();

  const hideModal = () => dispatch(doHideModal());

  return (
    <Modal onAborted={hideModal} isOpen type="card">
      <JoinMembershipCard {...props} />
    </Modal>
  );
}

export default ModalJoinMembership;
