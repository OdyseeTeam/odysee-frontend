// @flow
import CreditAmount from 'component/common/credit-amount';
import Symbol from '../common/symbol';
import I18nMessage from 'component/i18nMessage';
import React from 'react';

type Props = { LBCBalance: number, USDCBalance: number, ARBalance: number, dollarsPerAr: number, asset?: string, inline?: boolean, arConnecting: boolean };

function WalletSpendableBalanceHelp(props: Props) {
  const { LBCBalance, USDCBalance, dollarsPerAr, ARBalance, asset = 'lbc', inline, arConnecting } = props;

  const dollars = ARBalance * dollarsPerAr;
  const dollarsRounded = Number(dollars.toFixed(2));
  const getMessage = (text: string) =>
    asset === 'lbc' ? (
      <I18nMessage tokens={{ LBCBalance: <CreditAmount amount={LBCBalance} precision={4} /> }}>{text}</I18nMessage>
    ) : asset === 'usdc' ? (
      <I18nMessage tokens={{ USDCBalance: <Symbol amount={USDCBalance} token="usdc" precision={2} /> }}>
        {text}
      </I18nMessage>
    ) : (/* asset === 'ar' */
      <I18nMessage tokens={{ ConvertedBalance: dollarsRounded, ARBalance: <Symbol amount={ARBalance} token="ar" precision={2} /> }}>
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
      <span className="help--spendable">{getMessage('$%ConvertedBalance% (%ARBalance%) available.')}</span>
    ) : (
      <div className="help">{getMessage('Your immediately spendable balance is %ARBalance%.')}</div>
    );
  }
}

export default WalletSpendableBalanceHelp;
