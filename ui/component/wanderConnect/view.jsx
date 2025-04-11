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
  // const instanceRef = React.useRef(null);
  const wrapperRef = React.useRef();
  console.log('Wander: ',window.wanderApp)

  React.useEffect(() => {
    if (!window.wanderApp) {
      console.log('Got instance');
      const wanderInstance = new WanderEmbedded({
        clientId: 'ALPHA',
        baseURL: 'https://embed-dev.wander.app',
        baseServerURL: 'https://embed-api-dev.wander.app',
        iframe: {
          routeLayout: {
            default: {
              type: 'dropdown',
            },
            auth: {
              type: 'modal',
            },
            "auth-request": {
              type: 'modal',
            },
          },
          cssVars: {
            background: '#ff0000',
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
              }

            }

            .iframe {
              // background-color: var(--color-background) !important;
              background:blue !important;
            }
          `
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
        }
      });

      window.wanderApp = wanderInstance
    } else {
      console.log('No instance');
    }

  }, []);

  /*
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const wrapper = document.querySelector('#wanderEmbeddedIframe > .iframe-wrapper')
      console.log('wrapper: ', wrapper)
      if (wrapper) {
        const rect = element.getBoundingClientRect()
        const marginTop = parseInt(window.getComputedStyle(element).marginTop)

        const isOutside =
          e.clientY < rect.top - marginTop

        console.log('click: ', isOutside)
        window.wanderApp.close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  */

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
