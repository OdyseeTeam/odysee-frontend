// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';

type Props = {
  arweaveAddress: string,
  connectArWallet: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArWallet, arweaveAddress } = props;

  React.useEffect(() => {
    if (arweaveAddress) {
      connectArWallet();
    }
  }, [arweaveAddress]);

  async function handleArConnect() {
    connectArWallet();
  }

  return <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.WANDER} />;
}
