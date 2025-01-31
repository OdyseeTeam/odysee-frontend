// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  connectArConnect: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArConnect } = props;

  async function handleArConnect() {
    connectArConnect();
  }

  return <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.ARCONNECT} />;
}
