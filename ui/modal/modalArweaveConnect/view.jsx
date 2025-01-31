// @flow
// check provide button for arconnect connection
// wait for connect
// close.

import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import { Modal } from 'modal/modal';

type Props = {
  connected?: boolean,
  connecting?: boolean,
  error?: string,
  wallet?: any,
  doArConnect: () => void,
  doHideModal: () => void,
};

export default function ModalAnnouncements(props: Props) {
  const { connecting, error, wallet, doArConnect, doHideModal } = props;

  const getBody = () => {
    if (connecting) {
      return __('Connecting...');
    }
    if (error) {
      return __('Error connecting to Arweave: %error%', { error });
    }
    if (wallet) {
      return __('Connected');
    }
    return __('Connect to Arweave');
  };

  return (
    <Modal type="card" isOpen onAborted={doHideModal}>
      <Card
        className="announcement"
        body={getBody()}
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Connect'} onClick={doArConnect} />
            <Button button="alt" label={'Done'} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
}
