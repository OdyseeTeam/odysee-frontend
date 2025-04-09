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
  // const [instance, setInstance] = React.useState(null);
  const instanceRef = React.useRef(null);
  const wrapperRef = React.useRef();

  React.useEffect(() => {
    // Initialize the wallet
    console.log('instanceRef.current: ', instanceRef.current);

    if (!instanceRef.current) {
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
          theme: 'dark',
          label: true,
          wanderLogo: 'default',
          customStyles: `
            :host {
              position: relative !important;              
            }  
  
            .button {
              position:relative;
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

            .notifications{
              position:absolute;
              height: 19px;
              width: 19px;
              min-height: unset;
              min-width: unset;
              top: -0.4rem;
              right: -0.4rem;
              background-color: var(--color-notification);
              border: 1.5px solid var(--color-background);
              font-size: var(--font-small);
              font-weight: bold;
              line-height: 1.4rem;              
              transform: unset;
              border-radius:50%;
              padding-top:1px;
            }
          `,
        },
      });

      console.log('set instance');
      // setInstance(wanderInstance);
      instanceRef.current = wanderInstance;

      window.test = function () {
        instanceRef.current.open();
      };
    } else {
      console.log('No instance');
    }

    // Clean up on unmount
    /*
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
    */
  }, []);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
