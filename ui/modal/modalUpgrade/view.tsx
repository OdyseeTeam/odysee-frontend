import React from 'react';
import { Modal } from 'modal/modal';
import LastReleaseChanges from 'component/lastReleaseChanges';
import { useAppDispatch } from 'redux/hooks';
import { doDownloadUpgrade, doSkipUpgrade, doHideModal } from 'redux/actions/app';

const IS_MAC = navigator.userAgent.indexOf('Mac OS X') !== -1;

export default function ModalUpgrade() {
  const dispatch = useAppDispatch();

  function downloadUpgrade() {
    dispatch(doDownloadUpgrade());
  }

  function skipUpgrade() {
    dispatch(doHideModal());
    dispatch(doSkipUpgrade());
  }

  return (
    <Modal
      className={IS_MAC ? '' : 'main-wrapper--scrollbar'}
      isOpen
      contentLabel={__('Upgrade available')}
      title={__('LBRY leveled up')}
      type="confirm"
      confirmButtonLabel={__('Upgrade')}
      abortButtonLabel={__('Skip')}
      onConfirmed={downloadUpgrade}
      onAborted={skipUpgrade}
    >
      <p>
        {__('An updated version of LBRY is now available.')}{' '}
        {__('Your version is out of date and may be unreliable or insecure.')}
      </p>
      <LastReleaseChanges hideReleaseVersion />
    </Modal>
  );
}
