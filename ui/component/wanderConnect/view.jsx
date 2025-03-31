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
    console.log('TICK');
    const wanderInstance = new WanderEmbedded({
      clientId: 'ALPHA',
      iframe: {
        routeLayout: {
          auth: 'modal',
        },
      },
      button: {
        parent: wrapperRef.current,
        position: 'static',
        customStyles: `
              /* Position the button container */
              :host {
                position: relative !important;
                top: 0px;
                right: 0px;
              }
  
              /* Target the button element */
              .button {
                width: 40px;
                height:40px;
                border:none;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--color-header-button);
              }
  
              /* Target the Wander logo */
              .wanderLogo {
                min-width: 28px;
                margin-right:-3px;
              }
  
              /* Target the button label */
              .label {
                display:none;
              }
  
              /* Target the balance display */
              .balance {
                font-size: 12px;
                opacity: 0.8;
              }
  
              /* Target the connection indicator */
              .indicator {
                width: 6px;
                height: 6px;
              }
  
              /* Target the dApp logo */
              .dappLogo {
                width: 18px;
                height: 18px;
              }
  
              /* Target the notifications badge */
              .notifications {
                font-size: 10px;
                padding: 2px 6px;
              }
            `,
        // position: 'bottom-right',
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

  return <div className="wanderConnectWrapper" ref={wrapperRef} />;
}
