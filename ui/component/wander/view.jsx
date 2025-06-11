// @flow
import React from 'react';
// $FlowIgnore
import { WanderConnect } from '@wanderapp/connect';
import { LocalStorage } from 'util/storage';
import './style.scss';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  theme: string,
  auth: any,
  doArInit: () => void;
  connectArWallet: () => void,
  doArSetAuth: (status: string) => void,
};

export default function Wander(props: Props) {
  const { theme, auth, doArInit, doArSetAuth, connecting, connectArWallet, arweaveAddress } = props;
  const [instance, setInstance] = React.useState(null);
  const authRef = React.useRef(instance?.authInfo);
  const wrapperRef = React.useRef();
  const authInfo = window?.wanderInstance?.authInfo;

  React.useEffect(() => {
    if (instance) {
      if (auth?.authStatus === 'onboarding') instance.open();
      if (auth?.authStatus === 'authenticated') {
        // Connected
        if (window.wanderInstance.balanceInfo && !connecting && !arweaveAddress) {
          // Has backup
          const autoconnect = LocalStorage.getItem('WANDER_DISCONNECT') === 'true' ? false : true;
          if(autoconnect) connectArWallet();
        } else if (!window.wanderInstance.balanceInfo){
          // Missing backup
          window.wanderInstance.open();
        }
      }
    }
  }, [auth]);

  React.useEffect(() => {
    doArInit()
    const wanderInstance = new WanderConnect({
      clientId: 'FREE_TRIAL',
      theme: theme,
      button: {
        parent: wrapperRef.current,
        label: false,
        customStyles: `
          #wanderConnectButtonHost {
            display:none;
          }`,
      },
      iframe: {
        routeLayout: {
          default: {
            // type: 'dropdown',
            type: 'modal',
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

          .iframe {
            max-width:400px;
          }

          .iframe-wrapper {              
            border-radius: var(--border-radius);
            border: 2px solid var(--color-border) !important;
            background:unset;

            /*
            &[data-layout="dropdown"] {
              position: fixed;
              top: var(--header-height) !important;
              right:1px !important;
              left:unset !important;
              min-height: 500px;
              height: 600px;
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
            */
          }
        `,
      },
    });

    setInstance(wanderInstance);
    window.wanderInstance = wanderInstance;
    
    return () => {
      if (wanderInstance) {
        wanderInstance.destroy();
      }
    };
  }, [theme]);

  React.useEffect(() => {
    if (instance) {
      const isWanderApp = navigator.userAgent.includes('WanderMobile');
      if (isWanderApp) {
        window.wanderInstance.authInfo.authType = 'NATIVE_WALLET';        
        LocalStorage.setItem('WALLET_TYPE', 'NATIVE_WALLET');
      }
      doArSetAuth(instance.authInfo);
      window.addEventListener('arweaveWalletLoaded', () => {
        doArSetAuth(instance.authInfo);
      });
      window.addEventListener('message', (event) => {
        const data = event.data;
        if (data && data.id && !data.id.includes('react')) {
          if (data.type === 'embedded_auth') {
            if (data.data.authType || (data.data.authStatus === 'not-authenticated' && data.data.authType !== 'null' && data.data.authType !== null)) {
              LocalStorage.setItem('WALLET_TYPE', data.data.authType);              
              LocalStorage.setItem('WANDER_DISCONNECT', false);
              window.wanderInstance.close();
              doArSetAuth(data.data);
            }
          }
          if (data.type === 'embedded_request') {
            window.wanderInstance.close();
            window.wanderInstance.open();
          }
          if (data.type === 'event') {
            // console.log('message data: ', data);
          }
        }
      });

      return () => {
        const handler = () => {}
        window.removeEventListener('arweaveWalletLoaded', handler);
        window.removeEventListener('message', handler);
      };
    }
  }, [instance, doArSetAuth]);

  React.useEffect(() => {
    const current = window?.wanderInstance?.authInfo;
    if (current !== authRef.current) {
      authRef.current = current;
      doArSetAuth(current);
    }
  }, [authInfo, doArSetAuth]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
