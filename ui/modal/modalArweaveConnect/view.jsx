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
  doRegisterArweaveAddressClear: () => void,
  doRegisterArweaveAddress: (string, boolean) => void,
  doUpdateArweaveAddressDefault: (number) => void,
  activeApiAddresses: string[],
  defaultApiAddress: string,
  fullAPIArweaveStatus: any, // [ {status: 'active', address: '0x1234'}, ...]
  walletAddress: string,
  walletBalance: any,
  isArAccountRegistering: boolean,
  arAccountRegisteringError?: '',
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
    doRegisterArweaveAddressClear,
    fullAPIArweaveStatus,
    defaultApiAddress,
    walletAddress,
    // walletBalance,
    doRegisterArweaveAddress,
    doUpdateArweaveAddressDefault,
    isArAccountRegistering,
    arAccountRegisteringError,
    previousModal,
    isConnecting,
    // fullArweaveStatusArray,
  } = props;

  const apiEntryWithAddress = fullAPIArweaveStatus.find((status) => status.address === walletAddress);
  const id = apiEntryWithAddress ? apiEntryWithAddress.id : null;
  // const usdcBalance = walletBalance ? walletBalance.usdc : 0;
  const hasArweaveEntry = fullAPIArweaveStatus && fullAPIArweaveStatus.length > 0;

  React.useEffect(() => {
    // automatically register first address if there isn't one
    if (!hasArweaveEntry) {
      doRegisterArweaveAddress(walletAddress, true).then(() => {
        doHideModal();
      });
    }
  }, [walletAddress, doRegisterArweaveAddress, doHideModal, hasArweaveEntry, apiEntryWithAddress]);

  // if connected address is not registered at all
  const RegisterCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Unregistered Wallet Address')}
        subtitle={__(
          'Your Wander address, %address%, is not onboarded with the payments system. You can switch your Arweave address, or register this one for use.',
          { address: walletAddress }
        )}
        actions={
          <div className="section__actions">
            <Button
              button="primary"
              label={__('Register')}
              disabled={isArAccountRegistering}
              onClick={() => doRegisterArweaveAddress(walletAddress, true)}
            />
            <Button
              button="alt"
              label={__('Disconnect')}
              disabled={isArAccountRegistering}
              onClick={handleDisconnect}
            />
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
      doRegisterArweaveAddressClear();
      doOpenModal(previousModal.id, previousModal.modalProps);
    } else {
      doRegisterArweaveAddressClear();
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
              disabled={isArAccountRegistering}
              onClick={handleMakeDefault}
            />
            <Button
              button="alt"
              label={__('Disconnect')}
              disabled={isArAccountRegistering}
              onClick={handleDisconnect}
            />
          </div>
        }
      />
    );
  };

  const ErrorCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Wallet Connect Error')}
        body={
          <div className="section">
            <p>{__('There was an error registering that address: %error%', { error: arAccountRegisteringError })}</p>
            <p>
              {__('Reach out to %email% with questions.', {
                email: 'help@odysee.com',
              })}
            </p>
          </div>
        }
        actions={
          <div className="section__actions">
            <Button
              button="alt"
              label={__('Disconnect')}
              disabled={isArAccountRegistering}
              onClick={handleDisconnect}
            />
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
        body={<div className="section">{__('Connecting...')}</div>}
      />
    );
  };

  const showConnecting = (isConnecting || isArAccountRegistering) && !apiEntryWithAddress;
  const showRegister = !showConnecting && !arAccountRegisteringError && hasArweaveEntry && !apiEntryWithAddress;
  const showMakeDefault =
    !showConnecting && !arAccountRegisteringError && apiEntryWithAddress && defaultApiAddress !== walletAddress;
  const showErrorCard = !showConnecting && !!arAccountRegisteringError;

  if (apiEntryWithAddress && !showConnecting && !showRegister && !showMakeDefault) {
    handleCloseModal();
    return null;
  }

  console.log('hasArweaveEntry: ', hasArweaveEntry);
  console.log('apiEntryWithAddress: ', apiEntryWithAddress);

  // if you don't already have
  return (
    <Modal type="card" isOpen onAborted={doHideModal} disableOutsideClick>
      {showConnecting && <ConnectingCard />}
      {/* don't bother showing register unless you're showing a 2nd+ address */}
      {showRegister && <RegisterCard />}
      {showErrorCard && <ErrorCard />}
      {showMakeDefault && <MakeDefaultCard />}
      {/* {apiEntryWithAddress && defaultApiAddress === walletAddress && <TopUpCard />} */}
    </Modal>
  );
}
