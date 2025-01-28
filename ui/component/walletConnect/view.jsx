import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { createDataItemSigner, dryrun, message, result, results } from '@permaweb/aoconnect';

export default function WalletConnect(_props: { callback?: () => void }) {
  console.log(window.arweaveWallet);

  const [walletAddress, setWalletAddress] = React.useState(null);
  const [wallet, setWallet] = React.useState(null);
  const [walletType, setWalletType] = React.useState(null);
  const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];
  const WalletEnum = {
    arConnect: 'arConnect',
    othent: 'othent',
  };

  const [res, setRes] = React.useState(null);

  React.useEffect(() => {
    console.log('dryRun');
    const dryrunAsync = async () => {
      const response = await dryrun({
        process: '7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ',
        tags: [
          { name: 'Action', value: 'Balance' },
          { name: 'Owner', value: 'OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs' },
        ],
        data: null,
      });
      console.log('response: ', response);
      setRes(response);
    };
    dryrunAsync();
  }, []);

  async function handleArConnect() {
    console.log('handleArConnect');
    if (!walletAddress) {
      if (window.arweaveWallet) {
        try {
          await global.window?.arweaveWallet?.connect(WALLET_PERMISSIONS);
          setWalletAddress(await global.window.arweaveWallet.getActiveAddress());
          setWallet(window.arweaveWallet);
          setWalletType(WalletEnum.arConnect);
          // setWalletModalVisible(false);
          localStorage.setItem('walletType', WalletEnum.arConnect);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  async function handleDisconnect() {
    if (localStorage.getItem('walletType')) localStorage.removeItem('walletType');
    await global.window?.arweaveWallet?.disconnect();
    setWallet(null);
    setWalletAddress(null);
    // setProfile(null);
  }

  return (
    <>
      {wallet ? (
        <Button button="secondary" onClick={handleDisconnect} label="Disconnect" />
      ) : (
        <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.ARCONNECT} />
      )}
      <pre>{JSON.stringify(res, null, 2)}</pre>
    </>
  );
}
