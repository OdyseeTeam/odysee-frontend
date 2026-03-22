import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Spinner from '../spinner/view';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doArConnect } from 'redux/actions/arwallet';
import { selectArweaveAddress, selectArweaveConnecting, selectArweaveWanderAuth } from 'redux/selectors/arwallet';

export default function WalletConnect() {
  const dispatch = useAppDispatch();
  const arweaveAddress = useAppSelector(selectArweaveAddress);
  const connecting = useAppSelector(selectArweaveConnecting);
  const wanderAuth = useAppSelector(selectArweaveWanderAuth);
  const auth = wanderAuth === 'loading' || wanderAuth === 'onboarding' || connecting;

  async function getAddress() {
    try {
      const checkPluginConnection = await window.arweaveWallet.getActiveAddress();
      if (checkPluginConnection) dispatch(doArConnect());
    } catch (e) {
      console.error('not connected');
    }
  }

  React.useEffect(() => {
    if (!arweaveAddress) {
      getAddress();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arweaveAddress]);

  async function handleArConnect() {
    dispatch(doArConnect());
  }

  if (!window.arweaveWallet) {
    return <span>Install Wander Wallet extension.</span>;
  }

  return auth ? (
    <Button button="primary" label={__('Connecting...')} icon={ICONS.WANDER} />
  ) : connecting ? (
    <Button button="primary" onClick={handleArConnect} label={__('Connect')} icon={ICONS.WANDER} />
  ) : (
    <Spinner type="small" />
  );
}
