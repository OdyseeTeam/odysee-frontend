import CreditAmount from 'component/common/credit-amount';
import Symbol from '../common/symbol';
import I18nMessage from 'component/i18nMessage';
import React from 'react';
import { useAppSelector } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import { selectArweaveBalance, selectArweaveConnecting, selectArweaveExchangeRates } from 'redux/selectors/arwallet';

type Props = {
  asset?: string;
  inline?: boolean;
};

function WalletSpendableBalanceHelp(props: Props) {
  const { asset = 'lbc', inline } = props;
  const LBCBalance = useAppSelector(selectBalance);
  const USDCBalance = useAppSelector(selectArweaveBalance).usdc;
  const ARBalance = useAppSelector(selectArweaveBalance).ar;
  const dollarsPerAr = useAppSelector(selectArweaveExchangeRates).ar;
  const arConnecting = useAppSelector(selectArweaveConnecting);
  const dollars = ARBalance * dollarsPerAr;
  const dollarsRounded = Number(dollars.toFixed(2));

  const getMessage = (text: string) =>
    asset === 'lbc' ? (
      <I18nMessage
        tokens={{
          LBCBalance: <CreditAmount amount={LBCBalance} precision={4} />,
        }}
      >
        {text}
      </I18nMessage>
    ) : asset === 'usdc' ? (
      <I18nMessage
        tokens={{
          USDCBalance: <Symbol amount={USDCBalance} token="usdc" precision={2} />,
        }}
      >
        {text}
      </I18nMessage>
    ) : (
      /* asset === 'ar' */
      <I18nMessage
        tokens={{
          ConvertedBalance: dollarsRounded,
          ARBalance: <Symbol amount={ARBalance} token="ar" precision={2} />,
        }}
      >
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
