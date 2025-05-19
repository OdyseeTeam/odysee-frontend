// @flow
import React from 'react';
import { WanderConnect } from '@wanderapp/connect';
import './style.scss';

type Props = {
  arweaveAddress: string,
  connecting: boolean,
  theme: string,
  auth: string,
  connectArWallet: () => void,
  doArSetAuth: (status: string) => void,
};

export default function Wander(props: Props) {
  const { theme, auth, doArSetAuth, connectArWallet } = props;
  const [instance, setInstance] = React.useState(null);
  const authRef = React.useRef(instance?.authInfo?.authStatus);
  const wrapperRef = React.useRef();

  React.useEffect(() => {
    if(auth === 'onboarding') instance.open()
    if (auth == 'authenticated'){
      if(window.wanderInstance.balanceInfo) connectArWallet();
      else window.wanderInstance.open()
    } 
  }, [auth]);

  React.useEffect(() => {
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
    const check = () => {
      const status = instance?.authInfo.authStatus;
      if (status !== authRef.current) {
        authRef.current = status;
        doArSetAuth(status);
        forceUpdate();
        if (status !== 'loading') clearInterval(interval);
      }
    };

    if (instance) {
      doArSetAuth(instance.authInfo.authStatus);
      window.addEventListener('arweaveWalletLoaded', () => {
        doArSetAuth(instance.authInfo.authStatus);
      });

      const interval = setInterval(check, 200);
      return () => clearInterval(interval);
    }
  }, [instance]);

  React.useEffect(() => {
    const current = window?.wanderInstance?.authInfo.authStatus;
    if (current !== authRef.current) {
      authRef.current = current;
      doArSetAuth(current);
    }
  }, [window?.wanderInstance?.authInfo.authStatus]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
