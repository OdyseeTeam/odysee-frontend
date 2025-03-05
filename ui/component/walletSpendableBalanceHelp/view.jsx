// @flow
import CreditAmount from 'component/common/credit-amount';
import Symbol from '../common/symbol';
import I18nMessage from 'component/i18nMessage';
import React from 'react';

type Props = { LBCBalance: number, USDCBalance: number, asset?: string, inline?: boolean };

function WalletSpendableBalanceHelp(props: Props) {
  const { LBCBalance, USDCBalance, asset = 'lbc', inline } = props;

  const getMessage = (text: string) =>
    asset === 'lbc' ? (
      <I18nMessage tokens={{ LBCBalance: <CreditAmount amount={LBCBalance} precision={4} /> }}>{text}</I18nMessage>
    ) : (
      <I18nMessage tokens={{ USDCBalance: <Symbol amount={USDCBalance} token="usdc" precision={2} /> }}>
        {text}
      </I18nMessage>
    );

  if (asset === 'lbc') {
    return !LBCBalance ? null : inline ? (
      <span className="help--spendable">{getMessage('%LBCBalance% available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %LBCBalance%.')}</div>
    );
  } else {
    return USDCBalance ? (
      <span className="help--spendable">{getMessage('%USDCBalance% available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %USDCBalance%.')}</div>
    );
  }
}

export default WalletSpendableBalanceHelp;
