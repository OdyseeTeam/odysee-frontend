// @flow
// check provide button for arconnect connection
// wait for connect
// close.

import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import { Modal } from 'modal/modal';
import { FormField } from '../../component/common/form';

type Props = {
  connected?: boolean,
  connecting?: boolean,
  error?: string,
  walletAddress?: string,
  doArConnect: () => void,
  doHideModal: () => void,
  doRegisterArweaveAddress: (string) => void,
  activeApiAddress: string,
  fullAPIArweaveStatus: any, // [ {status: 'active', address: '0x1234'}, ...]
  walletAddress: string,
  walletBalance: any,
};

export default function ModalAnnouncements(props: Props) {
  const {
    connecting,
    error,
    doArConnect,
    doHideModal,
    fullAPIArweaveStatus,
    activeApiAddress,
    walletAddress,
    walletBalance,
    doRegisterArweaveAddress,
  } = props;

  const [makeDefault, setMakeDefault] = React.useState(false);

  const handleRegister = () => {
    doRegisterArweaveAddress(walletAddress, makeDefault);
  };

  const apiHasAddress = fullAPIArweaveStatus.find((status) => status.address === walletAddress);

  // if connected address is not registered at all
  const RegisterCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Unregistered Wallet Address')}
        subtitle={__(
          'Your arconnect address, %address%, is not onboarded with the payments system. You can switch your arconnect extension address, or register this one for use.',
          { address: walletAddress }
        )}
        body={
          <div className="section">
            <FormField
              name="make-default"
              type="checkbox"
              label={__('Make this address my default wallet address')}
              helper={__('This is only for regulatory compliance and the data will not be stored.')}
              checked={makeDefault}
              onChange={() => setMakeDefault(!makeDefault)}
            />
            {__(
              'Your arconnect address, %address%, is not onboarded with the payments system. You can switch your arconnect extension address, or register this one.',
              { address: walletAddress }
            )}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Register'} onClick={() => doRegisterArweaveAddress(walletAddress, true)} />
            <Button button="alt" label={'Done'} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  // if address is found, but not default
  const handleMakeDefault = () => {};
  const MakeDefaultCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Make Default Wallet Address')}
        body={
          <div className="section">
            {__('Your arconnect address, %address%, is not your primary wallet right now.', { address: walletAddress })}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Make Default'} onClick={handleMakeDefault} />
            <Button button="alt" label={'Not Now'} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  const redirectToTopup = () => {};
  const TopUpCard = () => {
    return (
      <Card
        className="announcement"
        title={__('No Balance')}
        body={
          <div className="section">
            {__('Your arconnect address, %address%, has a balance of %balance%. Would you like to top up?', {
              address: walletAddress,
              balance: walletBalance,
            })}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Top Up'} onClick={redirectToTopup} />
            <Button button="alt" label={'Done'} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  return (
    <Modal type="card" isOpen onAborted={doHideModal}>
      {!apiHasAddress && <RegisterCard />}
      {apiHasAddress && activeApiAddress !== walletAddress && <MakeDefaultCard />}
      {walletBalance === 0 && <TopUpCard />}
    </Modal>
  );
}
