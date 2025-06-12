// @flow
import React from 'react';
// $FlowIgnore
import { useArStatus } from 'effects/use-ar-status';
import Tooltip from 'component/common/tooltip';
import { useHistory } from 'react-router-dom'
import * as PAGES from 'constants/pages';
import './style.scss';

type Props = {
  arweaveAddress: string,
  arweaveStatus: any
};

export default function WanderButton(props: Props) {
  const { arweaveStatus } = props;
  const {
    activeArStatus,
  } = useArStatus();  
  const history = useHistory()

  const handleWalletClick= () => {
    history.push(`/$/${PAGES.WALLET}`)
  }

return (
<Tooltip
  title={
    activeArStatus === 'authenticating'
      ? __('Authenticating...')
      : activeArStatus === 'connected'
      ? arweaveStatus.balance.ar > 0
        ? __('Immediately spendable: $%spendable_balance_usd% (%spendable_balance_ar% AR)', { spendable_balance_usd: (arweaveStatus.balance.ar*arweaveStatus.exchangeRates.ar).toFixed(2), spendable_balance_ar: arweaveStatus.balance.ar.toFixed(6) })
        : __('Your Wallet')
      : ''
  }
>

    <div
      className={`wanderButton${
        activeArStatus === 'authenticating'
          ? ' wanderButton--authenticating'
          : activeArStatus === 'connecting'
          ? ' wanderButton--connecting'
          : activeArStatus === 'connected'
          ? ' wanderButton--connected'
          : ''
      }`}
      onClick={handleWalletClick}
    >
      ${activeArStatus === 'connected' ? `${(arweaveStatus.balance.ar*arweaveStatus.exchangeRates.ar).toFixed(2)}` : ''}
    </div>
  </Tooltip>
);



}
