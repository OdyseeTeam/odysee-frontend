// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Spinner from '../spinner/view';

type Props = {
  arweaveAddress: string,
  connectArWallet: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArWallet, arweaveAddress } = props;
  const [connecting, setConnecting] = React.useState(false);

  React.useEffect(() => {
    if (!arweaveAddress) {
      setConnecting(true);
      connectArWallet();
    }else{
      setConnecting(false);
    }
  }, [arweaveAddress]);

  async function handleArConnect() {
    connectArWallet();
  }

  return !connecting 
    ? <Button button="primary" onClick={handleArConnect} label={__('Connect')} icon={ICONS.WANDER} />
    : <Spinner type="small" />

}
