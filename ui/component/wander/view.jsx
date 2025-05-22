// @flow
import React from 'react';
import { WanderConnect } from '@wanderapp/connect';
import { LocalStorage } from 'util/storage';
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
  const { theme, auth, doArSetAuth, connecting, connectArWallet, arweaveAddress } = props;
  const [instance, setInstance] = React.useState(null);
  const authRef = React.useRef(instance?.authInfo);
  const wrapperRef = React.useRef();

  console.log('connecting: ', connecting)
  React.useEffect(() => {
    if(auth?.authStatus === 'onboarding') instance.open()
    if (auth?.authStatus == 'authenticated'){      
      if(window.wanderInstance.balanceInfo && !connecting && !arweaveAddress){
        connectArWallet();
      } else if(!window.wanderInstance.balanceInfo){
        console.log('OPEN A')
        window.wanderInstance.open()
      }
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
    /*
    const check = () => {
      const status = instance?.authInfo;
      if (status !== authRef.current) {
        authRef.current = status;
        doArSetAuth(status);
        if (window.wanderInstance?.authInfo?.authStatus === 'authenticated' || status?.authType === 'NATIVE_WALLET'){
          // LocalStorage.setItem('WALLET_TYPE', window.wanderInstance.authInfo.authType);
          if((!window.wanderInstance.authInfo.authType && window.wanderInstance.authInfo.authType !== 'null') && window.wanderInstance.authInfo.authType !== type) {
            wanderInstance.authInfo.authType = type
          }              
          clearInterval(interval);
        }
      }
    };

    const interval = setInterval(check, 1000);
    */

    if (instance) {
      doArSetAuth(instance.authInfo);
      window.addEventListener('arweaveWalletLoaded', () => {
        doArSetAuth(instance.authInfo);
      });
      window.addEventListener("message", (event) => {
        const data = event.data;
        if(data && data.id && !data.id.includes('react')){
          if(data.type === 'embedded_auth'){
            if(data.data.authType){
              console.log('SET AUTH: ', data.data.authType)
              LocalStorage.setItem('WALLET_TYPE', data.data.authType);
              window.wanderInstance.close()
              doArSetAuth(data.data);
            }            
          }
          if(data.type === 'embedded_request'){
            console.log('REQUEST: ', data.data)
            console.log('OPEN B')
            window.wanderInstance.close()
            window.wanderInstance.open()
          }
          /*
          if(data.type === "api_getPermissions_result"){
            console.log('api_getPermissions_result')
          }
          */
        }        
      });
      
      // return () => clearInterval(interval);
    }
  }, [instance]);

  React.useEffect(() => {
    const current = window?.wanderInstance?.authInfo;
    if (current !== authRef.current) {
      authRef.current = current;
      doArSetAuth(current);
    }
  }, [window?.wanderInstance?.authInfo]);

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
