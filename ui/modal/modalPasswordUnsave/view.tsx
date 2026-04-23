import React from 'react';
import { Modal } from 'modal/modal';
import { deleteSavedPassword } from 'util/saved-passwords';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  callback?: () => void;
};

export default function ModalPasswordUnsave(props: Props) {
  const { callback } = props;
  const dispatch = useAppDispatch();
  const closeModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);

  return (
    <Modal
      isOpen
      contentLabel={__('Unsave Password')}
      title={__('Clear saved password')}
      type="confirm"
      confirmButtonLabel={__('Forget')}
      abortButtonLabel={__('Nevermind')}
      onConfirmed={() =>
        deleteSavedPassword().then(() => {
          closeModal();

          if (callback) {
            callback();
          }
        })
      }
      onAborted={closeModal}
    >
      <p>
        {__('You are about to delete your saved password.')}{' '}
        {__('Your wallet will still be encrypted, but you will have to remember and enter it manually on startup.')}
      </p>
    </Modal>
  );
}
