// @flow
import React from 'react';
import { WanderEmbedded } from '@wanderapp/embed-sdk';
import './style.scss';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  connectArWallet: () => void,
};

export default function WanderConnect(props: Props) {
  const [instance, setInstance] = React.useState(null);
  const wrapperRef = React.useRef();

  React.useEffect(() => {
    // Initialize the wallet
    if (wrapperRef.current) {
      console.log('Got instance');
      const wanderInstance = new WanderEmbedded({
        clientId: 'ALPHA',
        baseURL: 'https://embed-dev.wander.app',
        baseServerURL: 'https://embed-api-dev.wander.app',
        iframe: {
          routeLayout: {
            auth: 'modal',
          },
        },
        button: {
          parent: wrapperRef.current,
          position: 'static',
          theme: 'light',
          label: true,
          wanderLogo: 'default',
          customStyles: `
            :host {
              position: relative !important;              
            }  
  
            .button {
              width: 40px;
              height:40px;
              display: flex;
              align-items: center;
              justify-content: center;
              
              &::before{
                background-color: var(--color-header-button);
                border:none;
              }
            }
  
            .label {
              display:none;
            }
  
            .wanderLogo{
              min-width:26px;
              margin-right:-4px !important;
            }

            .balance{
              display:none;
            }
          `,
        },
      });

      setInstance(wanderInstance);
    } else {
      console.log('No instance');
    }

    // Clean up on unmount
    return () => {
      wanderInstance.destroy();
    };
  }, [wrapperRef]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
