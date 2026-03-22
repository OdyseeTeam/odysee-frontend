import React, { useState } from 'react';
// @if TARGET='app'
import { ipcRenderer } from 'electron';
// @endif
import { Modal } from 'modal/modal';
import LastReleaseChanges from 'component/lastReleaseChanges';
import { useAppDispatch } from 'redux/hooks';
import { doAutoUpdateDeclined, doHideModal } from 'redux/actions/app';

const ModalAutoUpdateDownloaded = () => {
  const dispatch = useAppDispatch();
  const [disabled, setDisabled] = useState(false);

  const handleConfirm = () => {
    setDisabled(true);
    ipcRenderer.send('autoUpdateAccepted');
  };

  const handleAbort = () => {
    dispatch(doAutoUpdateDeclined());
    dispatch(doHideModal());
  };

  return (
    <Modal
      isOpen
      type="confirm"
      contentLabel={__('Upgrade Downloaded')}
      title={__('LBRY leveled up')}
      confirmButtonLabel={__('Upgrade Now')}
      abortButtonLabel={__('Not Now')}
      confirmButtonDisabled={disabled}
      onConfirmed={handleConfirm}
      onAborted={handleAbort}
    >
      <LastReleaseChanges />
    </Modal>
  );
};

export default ModalAutoUpdateDownloaded;
