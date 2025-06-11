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
  doOpenModal: (string, any) => void,
  doArDisconnect: () => void,
  doRegisterArweaveAddress: (string, boolean) => void,
  doUpdateArweaveAddressDefault: (number) => void,
  activeApiAddresses: string[],
  defaultApiAddress: string,
  fullAPIArweaveStatus: any, // [ {status: 'active', address: '0x1234'}, ...]
  walletAddress: string,
  walletBalance: any,
  isArAccountUpdating: boolean,
  previousModal?: { id: string, modalProps: any },
  isConnecting: boolean,
  fullArweaveStatusArray: Array<any>,
};

export default function ModalAnnouncements(props: Props) {
  const { push } = useHistory();
  const {
    doHideModal,
    doOpenModal,
    doArDisconnect,
    fullAPIArweaveStatus,
    defaultApiAddress,
    walletAddress,
    walletBalance,
    doRegisterArweaveAddress,
    doUpdateArweaveAddressDefault,
    isArAccountUpdating,
    previousModal,
    isConnecting,
    fullArweaveStatusArray,
  } = props;

  const apiEntryWithAddress = fullAPIArweaveStatus.find((status) => status.address === walletAddress);
  const id = apiEntryWithAddress ? apiEntryWithAddress.id : null;
  const usdcBalance = walletBalance ? walletBalance.usdc : 0;
  const hasArweaveEntry = fullAPIArweaveStatus && fullAPIArweaveStatus.length > 0;

  React.useEffect(() => {
    // automatically register first address if there isn't one
    if (!hasArweaveEntry) {
      doRegisterArweaveAddress(walletAddress, true);
    }
  }, [walletAddress, doRegisterArweaveAddress, hasArweaveEntry, apiEntryWithAddress]);

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
            <Button
              button="primary"
              label={__('Register')}
              disabled={isArAccountUpdating}
              onClick={() => doRegisterArweaveAddress(walletAddress, true)}
            />
            <Button button="alt" label={__('Nevermind')} disabled={isArAccountUpdating} onClick={handleDisconnect} />
          </div>
        }
      />
    );
  };

  // if address is found, but not default
  const handleMakeDefault = () => {
    if (id !== null) {
      doUpdateArweaveAddressDefault(id);

    }
    doHideModal();
  };

  const handleDisconnect = () => {
    doArDisconnect();
    if (previousModal) {
      doOpenModal(previousModal.id, previousModal.modalProps);
    } else {
      doHideModal();
    }
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
            <Button
              button="primary"
              label={__('Make Default')}
              disabled={isArAccountUpdating}
              onClick={handleMakeDefault}
            />
            <Button button="alt" label={__('Disconnect')} disabled={isArAccountUpdating} onClick={handleDisconnect} />
          </div>
        }
      />
    );
  };

  const handleCloseModal = () => {
    if (previousModal) {
      doOpenModal(previousModal.id, previousModal.modalProps);
    } else {
      doHideModal();
    }
  };

  const redirectToTopup = () => {
    push('/$/araccount?tab=buy');
    doHideModal();
  };

  const ConnectingCard = () => {
    return (
    <Card
      className="announcement"
      title={__('Connecting Wallet')}
      body={
        <div className="section">
          {__('Connecting...')}
        </div>
      }
    />
    );
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
              balance: usdcBalance || 0,
            })}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={__('Top Up')} disabled={isArAccountUpdating} onClick={redirectToTopup} />
            <Button button="alt" label={__('Not Now')} disabled={isArAccountUpdating} onClick={handleCloseModal} />
          </div>
        }
      />
    );
  };
  const showConnecting = (isConnecting || isArAccountUpdating) && !apiEntryWithAddress;
  const showRegister = hasArweaveEntry && !apiEntryWithAddress
  const showMakeDefault = apiEntryWithAddress && defaultApiAddress !== walletAddress;

  if (apiEntryWithAddress && !showConnecting && !showRegister && !showMakeDefault) {
    handleCloseModal();
    return;
  }

  // if you don't already have
  return (
    <Modal type="card" isOpen onAborted={doHideModal} disableOutsideClick>
      {(isConnecting || isArAccountUpdating) && !apiEntryWithAddress && <ConnectingCard />}
      { /* don't bother showing register unless you're showing a 2nd+ address */ }
      {hasArweaveEntry && !apiEntryWithAddress && <RegisterCard />}
      {apiEntryWithAddress && defaultApiAddress !== walletAddress && <MakeDefaultCard />}
      {/* {apiEntryWithAddress && defaultApiAddress === walletAddress && <TopUpCard />} */}
    </Modal>
  );
}
