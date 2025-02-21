// @flow
// check provide button for arconnect connection
// wait for connect
// close.

import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import { Modal } from 'modal/modal';
import { useHistory } from 'react-router';

type Props = {
  doHideModal: () => void,
  doRegisterArweaveAddress: (string) => void,
  doUpdateArweaveAddressDefault: (number) => void,
  activeApiAddresses: string[],
  defaultApiAddress: string,
  fullAPIArweaveStatus: any, // [ {status: 'active', address: '0x1234'}, ...]
  walletAddress: string,
  walletBalance: any,
  isArAccountUpdating: boolean,
};

export default function ModalAnnouncements(props: Props) {
  const { push } = useHistory();
  const {
    doHideModal,
    fullAPIArweaveStatus,
    defaultApiAddress,
    walletAddress,
    walletBalance,
    doRegisterArweaveAddress,
    doUpdateArweaveAddressDefault,
    isArAccountUpdating,
  } = props;

  const apiEntryWithAddress = fullAPIArweaveStatus.find((status) => status.address === walletAddress);
  const id = apiEntryWithAddress ? apiEntryWithAddress.id : null;
  const usdcBalance = walletBalance ? walletBalance.usdc : 0;

  // if connected address is not registered at all
  const RegisterCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Unregistered Wallet Address')}
        subtitle={__(
          'Your Wander address, %address%, is not onboarded with the payments system. You can switch your Wander extension address, or register this one for use.',
          { address: walletAddress }
        )}
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Register'} disabled={isArAccountUpdating} onClick={() => doRegisterArweaveAddress(walletAddress, true)} />
            <Button button="alt" label={'Done'} disabled={isArAccountUpdating} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  // if address is found, but not default
  const handleMakeDefault = () => {
    doUpdateArweaveAddressDefault(id);
  };
  const MakeDefaultCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Make Default Wallet Address')}
        body={
          <div className="section">
            {__('Your Wander address, %address%, is not your primary wallet right now.', { address: walletAddress })}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Make Default'}  disabled={isArAccountUpdating} onClick={handleMakeDefault} />
            <Button button="alt" label={'Not Now'} disabled={isArAccountUpdating} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  const redirectToTopup = () => {
    push('/$/paymentaccount?tab=buy');
    doHideModal();
  };
  const TopUpCard = () => {
    return (
      <Card
        className="announcement"
        title={__('No Balance')}
        body={
          <div className="section">
            {__('Your Wander address, %address%, has a balance of %balance%. Would you like to top up?', {
              address: walletAddress,
              balance: usdcBalance,
            })}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={'Top Up'} disabled={isArAccountUpdating} onClick={redirectToTopup} />
            <Button button="alt" label={'Done'} disabled={isArAccountUpdating} onClick={doHideModal} />
          </div>
        }
      />
    );
  };

  return (
    <Modal type="card" isOpen onAborted={doHideModal} disableOutsideClick>
      {!apiEntryWithAddress && <RegisterCard />}
      {apiEntryWithAddress && defaultApiAddress !== walletAddress && <MakeDefaultCard />}
      {apiEntryWithAddress && defaultApiAddress === walletAddress && <TopUpCard />}
    </Modal>
  );
}
