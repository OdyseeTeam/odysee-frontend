// @flow
import CreditAmount from 'component/common/credit-amount';
import Symbol from '../common/symbol';
import I18nMessage from 'component/i18nMessage';
import React from 'react';

type Props = { LBCBalance: number, USDCBalance: number, ARBalance: number, asset?: string, inline?: boolean, arConnecting: boolean };

function WalletSpendableBalanceHelp(props: Props) {
  const { LBCBalance, USDCBalance, ARBalance, asset = 'lbc', inline, arConnecting } = props;

  const getMessage = (text: string) =>
    asset === 'lbc' ? (
      <I18nMessage tokens={{ LBCBalance: <CreditAmount amount={LBCBalance} precision={4} /> }}>{text}</I18nMessage>
    ) : asset === 'usdc' ? (
      <I18nMessage tokens={{ USDCBalance: <Symbol amount={USDCBalance} token="usdc" precision={2} /> }}>
        {text}
      </I18nMessage>
    ) : (/* asset === 'ar' */
      <I18nMessage tokens={{ ARBalance: <Symbol amount={ARBalance} token="ar" precision={2} /> }}>
        {text}
      </I18nMessage>
    );

  if (asset === 'lbc') {
    return !LBCBalance ? null : inline ? (
      <span className="help--spendable">{getMessage('%LBCBalance% available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %LBCBalance%.')}</div>
    );
  } else if (asset === 'usdc') {
    return arConnecting ? (
      <span className="help">{__('Connecting...')}</span>
    ) : USDCBalance ? (
      <span className="help--spendable">{getMessage('%USDCBalance% available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %USDCBalance%.')}</div>
    );
  } else if (asset === 'ar') {
    return arConnecting ? (
      <span className="help">{__('Connecting...')}</span>
    ) : ARBalance ? (
      <span className="help--spendable">{getMessage('%ARBalance% available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %ARBalance%.')}</div>
    );
  }
}

export default WalletSpendableBalanceHelp;
