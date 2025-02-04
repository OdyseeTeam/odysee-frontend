// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  arweaveAddress: string,
  connectArWallet: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArWallet, arweaveAddress } = props;

  React.useEffect(() => {
    console.log('arweaveAddress: ', arweaveAddress);
    if (arweaveAddress) {
      connectArWallet();
    }
  }, [arweaveAddress]);

  async function handleArConnect() {
    connectArWallet();
  }

  return <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.ARCONNECT} />;
}
