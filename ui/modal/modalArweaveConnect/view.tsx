// check provide button for arconnect connection
// wait for connect
// close.
import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import { Modal } from 'modal/modal';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doHideModal, doOpenModal } from 'redux/actions/app';
import { doArConnect, doArDisconnect } from 'redux/actions/arwallet';
import {
  selectAPIArweaveDefaultAddress,
  selectArAccountRegistering,
  selectArAccountRegisteringError,
  selectFullAPIArweaveStatus,
} from 'redux/selectors/stripe';
import {
  doRegisterArweaveAddress,
  doRegisterArweaveAddressClear,
  doUpdateArweaveAddressDefault,
} from 'redux/actions/stripe';
import { selectArweaveConnecting } from 'redux/selectors/arwallet';

type Props = {
  previousModal?: {
    id: string;
    modalProps: any;
  };
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

export default function ModalAnnouncements(props: Props) {
  const { previousModal } = props;
  const dispatch = useAppDispatch();

  const defaultApiAddress = useAppSelector(selectAPIArweaveDefaultAddress);
  const fullAPIArweaveStatus = useAppSelector(selectFullAPIArweaveStatus);
  const walletAddress = useAppSelector((state) => state.arwallet.address);
  const walletBalance = useAppSelector((state) => state.arwallet.balance);
  const isArAccountRegistering = useAppSelector(selectArAccountRegistering);
  const arAccountRegisteringError = useAppSelector(selectArAccountRegisteringError);
  const isConnecting = useAppSelector(selectArweaveConnecting);

  const apiEntryWithAddress = fullAPIArweaveStatus.find((status) => status.address === walletAddress);
  const id = apiEntryWithAddress ? apiEntryWithAddress.id : null;
  // const usdcBalance = walletBalance ? walletBalance.usdc : 0;
  const hasArweaveEntry = fullAPIArweaveStatus && fullAPIArweaveStatus.length > 0;
  React.useEffect(() => {
    // automatically register first address if there isn't one
    if (!hasArweaveEntry && walletAddress) {
      dispatch(doRegisterArweaveAddress(walletAddress, true))
        .then(() => {
          dispatch(doHideModal());
        })
        .catch((e) => {
          if (e?.message === 'address already exists for another user') {
            dispatch(doHideModal());
          }
        });
    }
  }, [walletAddress, dispatch, hasArweaveEntry, apiEntryWithAddress]);

  // if connected address is not registered at all
  const RegisterCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Unregistered Wallet Address')}
        subtitle={__(
          'Your Wander address, %address%, is not onboarded with the payments system. You can switch your Arweave address, or register this one for use.',
          {
            address: walletAddress,
          }
        )}
        actions={
          <div className="section__actions">
            <Button
              button="primary"
              label={__('Register')}
              disabled={isArAccountRegistering}
              onClick={() => dispatch(doRegisterArweaveAddress(walletAddress, true))}
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
      dispatch(doUpdateArweaveAddressDefault(id));
    }

    dispatch(doHideModal());
  };

  const handleDisconnect = () => {
    dispatch(doArDisconnect());

    if (previousModal) {
      dispatch(doRegisterArweaveAddressClear());
      dispatch(doOpenModal(previousModal.id, previousModal.modalProps));
    } else {
      dispatch(doRegisterArweaveAddressClear());
      dispatch(doHideModal());
    }
  };

  const MakeDefaultCard = () => {
    return (
      <Card
        className="announcement"
        title={__('Make Default Wallet Address')}
        body={
          <div className="section">
            {__('Your Wander address, %address%, is not your primary wallet right now.', {
              address: walletAddress,
            })}
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
            <p>
              {__('There was an error registering that address: %error%', {
                error: arAccountRegisteringError,
              })}
            </p>
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
      dispatch(doOpenModal(previousModal.id, previousModal.modalProps));
    } else {
      dispatch(doHideModal());
    }
  };

  const showConnecting = (isConnecting || isArAccountRegistering) && !apiEntryWithAddress;
  const showRegister = !showConnecting && !arAccountRegisteringError && hasArweaveEntry && !apiEntryWithAddress;
  const showMakeDefault =
    !showConnecting && !arAccountRegisteringError && apiEntryWithAddress && defaultApiAddress !== walletAddress;
  const showErrorCard =
    !showConnecting &&
    !!arAccountRegisteringError &&
    arAccountRegisteringError !== 'address already exists for another user';

  if (
    (apiEntryWithAddress && !showConnecting && !showRegister && !showMakeDefault) ||
    arAccountRegisteringError === 'address already exists for another user'
  ) {
    handleCloseModal();
    return null;
  }

  // if you don't already have
  return (
    <Modal type="card" isOpen onAborted={() => dispatch(doHideModal())} disableOutsideClick>
      {showConnecting && <ConnectingCard />}
      {/* don't bother showing register unless you're showing a 2nd+ address */}
      {showRegister && <RegisterCard />}
      {showErrorCard && <ErrorCard />}
      {showMakeDefault && <MakeDefaultCard />}
      {/* {apiEntryWithAddress && defaultApiAddress === walletAddress && <TopUpCard />} */}
    </Modal>
  );
}
