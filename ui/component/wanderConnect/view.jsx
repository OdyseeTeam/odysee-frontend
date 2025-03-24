// @flow
import React from 'react';
import { WanderEmbedded } from '@wanderapp/embed-sdk';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  connectArWallet: () => void,
};

export default function WanderConnect(props: Props) {
  const [instance, setInstance] = React.useState(null);

  React.useEffect(() => {
    console.log('TICK');
    const wanderInstance = new WanderEmbedded({
      iframe: {
        routeLayout: {
          auth: 'modal',
        },
      },
      button: {
        position: 'bottom-right',
        theme: 'system',
        label: false,
        wanderLogo: 'default',
        cssVars: {
          light: {
            background: '#0000ff',
            color: '#ff0000',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          dark: {
            background: '#ff0000',
            color: '#00ff00',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    });

    console.log('wanderInstance: ', wanderInstance);
    setInstance(wanderInstance);

    return () => {
      if (wanderInstance) {
        wanderInstance.destroy();
      }
    };
  }, []);

  return <span>Test</span>;
}
