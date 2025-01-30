import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { dryrun } from '@permaweb/aoconnect';

type Props = {
  connectArConnect: () => void,
};

export default function WalletConnect(props: Props) {
  const { connectArConnect } = props;

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
  }

  return <Button button="primary" onClick={handleArConnect} label="Connect" icon={ICONS.ARCONNECT} />;
}
