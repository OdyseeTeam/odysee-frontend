// @flow
import React from 'react';
// $FlowIgnore
import { useArStatus } from 'effects/use-ar-status';
import './style.scss';

type Props = {
  arweaveAddress: string,
  arweaveStatus: any
};

export default function WalletStatus(props: Props) {
  const {
    activeArStatus
  } = useArStatus();

  return activeArStatus !== 'connected' ? (
    <div className={`wallet-status${activeArStatus === 'authenticating' ? ' wallet-status--authenticating' : ''}`}>
      {activeArStatus === 'not-authenticated' ? (
        arweaveWallets.length > 0 ? (
          <>
            <p>{__('To join a new membership on Odysee, you need to be signed into Wander.')}</p>
            <NavLink to="/$/wallet">Wallet settings</NavLink>
          </>
        ) : (
          <>
            <p>{__('To join a new membership on Odysee, you need to create and/or sign into Wander – a cryptocurrency wallet compatible with AR.')}</p>
            <NavLink to="/$/wallet">Wallet settings</NavLink>
          </>
        )
      ) : (
        <>
          <p>{__('Establishing wallet connection. Please wait...')}</p>
          <a onClick={() => window.wanderInstance.open()}>Show status</a>
        </>
      )}            
    </div>
  ) : null;
}
