import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import { useAppDispatch } from 'redux/hooks';
import { doQuitAnyDaemon } from 'redux/actions/app';

type Props = {
  onContinueAnyway: () => void;
};

export default function ModalIncompatibleDaemon(props: Props) {
  const { onContinueAnyway } = props;
  const dispatch = useAppDispatch();

  return (
    <Modal
      isOpen
      title={__('Incompatible daemon')}
      contentLabel={__('Incompatible daemon running')}
      type="confirm"
      confirmButtonLabel={__('Close App and LBRY Processes')}
      abortButtonLabel={__('Continue Anyway')}
      onConfirmed={() => dispatch(doQuitAnyDaemon())}
      onAborted={onContinueAnyway}
    >
      <p>
        {__(
          'This app is running with an incompatible version of the LBRY protocol. You can still use it, but there may be issues. Re-run the installation package for best results.'
        )}{' '}
        {/* I noticed the period below could end up on a line by itself. This is probably not the ideal solution, but seems better than not adding this. */}
        <span
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          <Button button="link" label={__('Learn more')} href="https://lbry.com/faq/incompatible-protocol-version" />
        </span>
      </p>
    </Modal>
  );
}
