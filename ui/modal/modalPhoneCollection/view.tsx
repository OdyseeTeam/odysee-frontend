import React from 'react';
import { Navigate } from 'react-router-dom';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import UserPhoneVerify from 'component/userPhoneVerify';
import UserPhoneNew from 'component/userPhoneNew';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectPhoneToVerify, selectUser } from 'redux/selectors/user';
import { doHideModal } from 'redux/actions/app';

function ModalPhoneCollection() {
  const dispatch = useAppDispatch();
  const phone = useAppSelector(selectPhoneToVerify);
  const user = useAppSelector(selectUser);

  const closeModal = () => dispatch(doHideModal());

  // this shouldn't happen
  if (!user) {
    return null;
  }

  function renderInner() {
    const cancelButton = <Button button="link" onClick={closeModal} label={__('Not Now')} />;

    if (!user.is_identity_verified && !phone) {
      return <UserPhoneNew cancelButton={cancelButton} />;
    } else if (!user.is_identity_verified) {
      return <UserPhoneVerify cancelButton={cancelButton} />;
    }

    closeModal();
    return <Navigate replace to="/$/rewards" />;
  }

  return (
    <Modal type="card" isOpen contentLabel="Phone" onAborted={closeModal}>
      {renderInner()}
    </Modal>
  );
}

export default ModalPhoneCollection;
