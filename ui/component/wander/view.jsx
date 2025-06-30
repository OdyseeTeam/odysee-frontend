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
  authenticated: any,
  doArInit: () => void;
  connectArWallet: () => void,
  doArSetAuth: (status: string) => void,
  doArUpdateBalance: () => void,
  doCleanTips: () => void,
};

export default function Wander(props: Props) {
  const { theme, auth, authenticated, doArInit, doArSetAuth, connecting, connectArWallet, arweaveAddress, doArUpdateBalance, doCleanTips } = props;
  const [instance, setInstance] = React.useState(null);
  const wrapperRef = React.useRef();

  React.useEffect(() => {
    if (instance) {
      if (auth?.authStatus === 'onboarding') instance.open();
      if (auth?.authStatus === 'authenticated') {
        // Connected
        if (window.wanderInstance.balanceInfo && !connecting && !arweaveAddress) {
          // Has backup
          connectArWallet();
        } else if (!window.wanderInstance.balanceInfo) {
          // Missing backup
          window.wanderInstance.open();
          connectArWallet();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  React.useEffect(() => {
    if (authenticated) {
      doArInit();
      try {
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
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        window.wanderInstance.destroy();
      } catch {}
    }

    return () => {
      try {
        window.wanderInstance.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  React.useEffect(() => {
    if (window.wanderInstance) {
      const newTheme = theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system';
      window.wanderInstance.setTheme(newTheme)
    };
  }, [theme]);

  React.useEffect(() => {
    if (!instance) return;

    const isWanderApp = navigator.userAgent.includes('WanderMobile');
    if (isWanderApp) {
      window.wanderInstance.authInfo.authType = 'NATIVE_WALLET';
      LocalStorage.setItem('WALLET_TYPE', 'NATIVE_WALLET');
    }

    doArSetAuth(instance.authInfo);

    const onArweaveWalletLoaded = () => {
      doArSetAuth(instance.authInfo);
    };

    const onMessage = (event) => {
      const data = event.data;
      if (data && data.id && !data.id.includes('react')) {
        if (data.type === 'embedded_auth') {
          if (
            data.data.authType ||
            (data.data.authStatus === 'not-authenticated' &&
              data.data.authType !== 'null' &&
              data.data.authType !== null)
          ) {
            if (data.data.authStatus !== 'loading') {
              LocalStorage.setItem('WALLET_TYPE', data.data.authType);
              window.wanderInstance.close();
              doArSetAuth(data.data);
            }
          } else if (data.data.authStatus === 'not-authenticated') {
            doArSetAuth(data.data);
          }
        }
        if (data.type === 'embedded_request') {
          if (window.wanderInstance.pendingRequests !== 0) {
            window.wanderInstance.close();
            window.wanderInstance.open();
          } else {
            window.wanderInstance.close();
          }
        }
        if (data.type === 'embedded_balance') {
          doArUpdateBalance();
        }
        if (data.type === 'embedded_close') {
          doCleanTips();
        }
      }
    };

    window.addEventListener('arweaveWalletLoaded', onArweaveWalletLoaded);
    window.addEventListener('message', onMessage);

    const balanceUpdate = setInterval(() => {
      doArUpdateBalance();
    }, 60000);

    return () => {
      window.removeEventListener('arweaveWalletLoaded', onArweaveWalletLoaded);
      window.removeEventListener('message', onMessage);
      clearInterval(balanceUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, doArSetAuth]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
