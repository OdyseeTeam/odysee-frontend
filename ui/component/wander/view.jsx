// @flow
import React from 'react';
import { WanderConnect } from '@wanderapp/connect';

import './style.scss';
import { doArSetAuth } from '../../redux/actions/arwallet';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  theme: string,
  connectArWallet: () => void,
  doArSetAuth: (status: string) => void,
};

export default function Wander(props: Props) {
  const { theme } = props;
  const [instance, setInstance] = React.useState(null);
  // const instanceRef = React.useRef(null);
  const wrapperRef = React.useRef();
  // console.log('Wander: ', window.wanderApp);
  // console.log('instance: ', instance);

  React.useEffect(() => {
    // Initialize the wallet
    const wanderInstance = new WanderConnect({
      clientId: 'FREE_TRIAL',
      theme: theme,
      button: {
        // parent: wrapperRef.current,
        label: false,
        customStyles: `
          #wanderConnectButtonHost {
            display:none;
          }`,
      },
      iframe: {
        routeLayout: {
          default: {
            type: 'dropdown',
          },
          auth: {
            type: 'modal',
          },
          'auth-request': {
            type: 'modal',
          },
        },
        cssVars: {
          light: {
            shadowBlurred: 'none',
          },
          dark: {
            backgroundColor: '#fff000',
            background: '#00ff00',
            shadowBlurred: 'none',
            boxShadow: 'none',
          },
        },
        customStyles: `
          .backdrop {
            margin-top:var(--header-height);
            background-color: var(--color-background-overlay);
            backdrop-filter: blur(2px);
          }

          .iframe-wrapper {              
            border-radius: var(--border-radius);
            border: 2px solid var(--color-border) !important;
            background:unset;

            &[data-layout="dropdown"] {
              position: fixed;
              top: var(--header-height) !important;
              right:1px !important;
              left:unset !important;
              border-top:unset !important;
              border-radius: 0 0 var(--border-radius) var(--border-radius);
              transform: scaleY(0) !important;
              transform-origin: top;
              transition: transform .2s !important;

              &.show{
                transform: scaleY(1) !important;
              }

              & + .backdrop {
                backdrop-filter: unset;
                background-color: unset;
              }
            }
          }
        `,
      },
    });

    setInstance(wanderInstance);
    window.wanderInstance = wanderInstance;

    // Clean up on unmount
    return () => {
      if (wanderInstance) {
        wanderInstance.destroy();
      }
    };
  }, [theme]);

  React.useEffect(() => {
    if (instance) {
      doArSetAuth(instance.authInfo.authStatus);
      window.addEventListener('arweaveWalletLoaded', () => {
        doArSetAuth(instance.authInfo.authStatus)
          .then((a) => {
            console.log('aaa');
          })
          .catch((e) => {});
      });
    }
  }, [instance]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
