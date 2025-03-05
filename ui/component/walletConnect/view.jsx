// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Spinner from '../spinner/view';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  connectArWallet: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArWallet, arweaveAddress, connecting } = props;

  async function getAddress() {
    try {
      const checkPluginConnection = await window.arweaveWallet.getActiveAddress();
      if (checkPluginConnection) connectArWallet();
    } catch (e) {
      console.log('not connected');
    }
  }

  React.useEffect(() => {
    if (!arweaveAddress) {
      getAddress();
    }
  }, [arweaveAddress]);

  async function handleArConnect() {
    connectArWallet();
  }

  return !connecting ? (
    <Button button="primary" onClick={handleArConnect} label={__('Connect')} icon={ICONS.WANDER} />
  ) : (
    <Spinner type="small" />
  );
}
