import React, { useState, useEffect } from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import { deleteAuthToken } from 'util/saved-passwords';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectWalletDecryptSucceeded } from 'redux/selectors/wallet';
import { doHideModal } from 'redux/actions/app';
import { doWalletDecrypt, doWalletStatus } from 'redux/actions/wallet';

function ModalWalletDecrypt() {
  const dispatch = useAppDispatch();
  const walletDecryptSucceded = useAppSelector(selectWalletDecryptSucceeded);
  const [submitted, setSubmitted] = useState(false);

  const closeModal = () => dispatch(doHideModal());

  useEffect(() => {
    if (submitted && walletDecryptSucceded) {
      deleteAuthToken();
      closeModal();
      dispatch(doWalletStatus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, walletDecryptSucceded]);

  function submitDecryptForm() {
    setSubmitted(true);
    dispatch(doWalletDecrypt());
  }

  return (
    <Modal
      isOpen
      title={__('Decrypt wallet')}
      contentLabel={__('Decrypt wallet')}
      type="confirm"
      confirmButtonLabel={__('Decrypt wallet')}
      abortButtonLabel={__('Cancel')}
      onConfirmed={() => submitDecryptForm()}
      onAborted={closeModal}
    >
      <p>
        {__('Your wallet has been encrypted with a local password, performing this action will remove this password.')}{' '}
        <Button button="link" label={__('Learn more')} href="https://lbry.com/faq/wallet-encryption" />.
      </p>
    </Modal>
  );
}

export default ModalWalletDecrypt;
