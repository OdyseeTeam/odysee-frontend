import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { dryrun } from '@permaweb/aoconnect';

type Props = {
  connectArConnect: () => void,
};

export default function WalletConnect(props) {
  const { wallet, setWallet, connectArConnect } = props;
  const [walletAddress, setWalletAddress] = React.useState(null);

  console.log('Props:', props);

  const [walletType, setWalletType] = React.useState(null);
  const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];
  const WalletEnum = {
    arConnect: 'arConnect',
    othent: 'othent',
  };

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
        owner: 'OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs',
      });
      console.log('response: ', response);
    };
    dryrunAsync();
  }, []);

  async function handleArConnect() {
    connectArConnect();
    /*
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
      */
  }

  async function handleDisconnect() {
    if (localStorage.getItem('walletType')) localStorage.removeItem('walletType');
    await global.window?.arweaveWallet?.disconnect();
    setWallet(null);
    setWalletAddress(null);
    // setProfile(null);
  }

  return <>{!wallet && <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.ARCONNECT} />}</>;
}
