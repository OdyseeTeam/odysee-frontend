// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Spinner from '../spinner/view';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  test: any,
  connectArWallet: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArWallet, test, arweaveAddress, connecting } = props;
  // const [connecting, setConnecting] = React.useState(false);
  console.log('test: ', test);
  console.log('window.arweaveWallet: ', window.arweaveWallet);

  async function getAddress() {
    try {
      const checkPluginConnection = await window.arweaveWallet.getActiveAddress();
      if (checkPluginConnection) connectArWallet();
    } catch (e) {
      console.log('not connected');
    }

    // console.log(x);
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
