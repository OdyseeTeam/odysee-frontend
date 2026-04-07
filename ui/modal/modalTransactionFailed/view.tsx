import React from 'react';
import { Modal } from 'modal/modal';
import { SITE_HELP_EMAIL } from 'config';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

export default function ModalTransactionFailed() {
  const dispatch = useAppDispatch();
  const closeModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);

  return (
    <Modal isOpen contentLabel={__('Transaction failed')} title={__('Transaction failed')} onConfirmed={closeModal}>
      <p>
        {__('Sorry about that. Contact %SITE_HELP_EMAIL% if you continue to have issues.', {
          SITE_HELP_EMAIL,
        })}
      </p>
    </Modal>
  );
}
