// @flow
import React from 'react';
import { NavLink } from 'react-router-dom';
// $FlowIgnore
import { useArStatus } from 'effects/use-ar-status';
import './style.scss';

type Props = {
  arweaveWallets: any,
  doArConnect: () => void,
};

export default function WalletStatus(props: Props) {
  const { arweaveWallets, doArConnect } = props;
  const { activeArStatus } = useArStatus();

  return arweaveWallets && activeArStatus !== 'connected' ? (
    <div
      className={`wallet-status${
        activeArStatus === 'authenticating'
          ? ' wallet-status--authenticating'
          : activeArStatus === 'authenticated'
          ? ' wallet-status--authenticated'
          : ''
      }`}
    >
      {activeArStatus === 'not-authenticated' ? (
        arweaveWallets.length > 0 ? (
          <>
            <p>{__('To use AR on Odysee, you need to be signed into Wander.')}</p>
            <NavLink to="/$/wallet">Wallet settings</NavLink>
          </>
        ) : (
          <>
            <p>
              {__(
                'To use AR on Odysee, you need to create and/or sign into Wander – a cryptocurrency wallet compatible with AR.'
              )}{' '}
              <a
                href="https://help.odysee.tv/category-monetization/setup"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                {__('Learn more')}
              </a>
            </p>
            <NavLink to="/$/wallet">Wallet settings</NavLink>
          </>
        )
      ) : activeArStatus === 'authenticated' ? (
        <>
          <p>{__('To use AR on Odysee, the Wander wallet must be connected.')}</p>
          <div>
            <a className="link" onClick={() => doArConnect()}>
              Connect now
            </a>
            <span> or </span>
            <a className="link" onClick={() => window.wanderInstance.open()}>
              change login
            </a>
          </div>
        </>
      ) : (
        <>
          <p>{__('Odysee is signing you in to your Wander wallet. Please wait...')}</p>
          <a onClick={() => window.wanderInstance.open()}>Show status</a>
        </>
      )}
    </div>
  ) : null;
}
