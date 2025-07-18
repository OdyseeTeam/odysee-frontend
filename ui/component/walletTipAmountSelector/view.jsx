// @flow
import React from 'react';
import 'scss/component/_wallet-tip-selector.scss';
import { FormField } from 'component/common/form';
import { MINIMUM_PUBLISH_BID } from 'constants/claim';
import { useIsMobile } from 'effects/use-screensize';
import Button from 'component/button';
import classnames from 'classnames';
import usePersistedState from 'effects/use-persisted-state';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import { TAB_FIAT, TAB_USD } from 'constants/tip_tabs';

const DEFAULT_TIP_AMOUNTS = [1, 5, 25, 100];

type Props = {
  uri: string,
  activeTab: string,
  amount: number,
  LBCBalance: number,
  USDCBalance: number,
  arBalance: number,
  claim: StreamClaim,
  customTipAmount?: number,
  exchangeRate?: any,
  fiatConversion?: boolean,
  tipError: string,
  uri: string,
  canReceiveFiatTips: ?boolean,
  arweaveTipData: ArweaveTipDataForId,
  isComment?: boolean,
  onChange: (number) => void,
  setDisableSubmitButton: (boolean) => void,
  setTipError: (any) => void,
  doTipAccountCheckForUri: (uri: string) => void,
  arExchangeRate: any,
};

function WalletTipAmountSelector(props: Props) {
  const {
    uri,
    activeTab,
    amount,
    LBCBalance,
    USDCBalance,
    arBalance,
    claim,
    // convertedAmount,
    customTipAmount,
    exchangeRate,
    fiatConversion,
    tipError,
    canReceiveFiatTips,
    arweaveTipData,
    isComment,
    onChange,
    setDisableSubmitButton,
    setTipError,
    doTipAccountCheckForUri,
    arExchangeRate,
  } = props;

  const USDBalance = arBalance * arExchangeRate?.ar;
  const isMobile = useIsMobile();
  const [useCustomTip, setUseCustomTip] = usePersistedState('comment-support:useCustomTip', true);

  const convertToTwoDecimalsOrMore = (number: number, decimals: number = 2) =>
    Number((Math.round(number * 10 ** decimals) / 10 ** decimals).toFixed(decimals));
  const amountInArEstimated = (amount / arExchangeRate?.ar).toFixed(6);

  const tipAmountsToDisplay = DEFAULT_TIP_AMOUNTS;

  // if it's fiat but there's no card saved OR the creator can't receive fiat tips
  const shouldDisableARSelectors =
    activeTab === TAB_USD && (!arweaveTipData || (arweaveTipData && arweaveTipData.status !== 'active'));

  /**
   * whether tip amount selection/review functionality should be disabled
   * @param [amount] LBC amount (optional)
   * @returns {boolean}
   */
  function shouldDisableAmountSelector(amount: number) {
    const isARCondition = activeTab === TAB_USD && (amount > USDBalance || USDBalance === 0);

    // if it's LBC but the balance isn't enough, or fiat conditions met
    // $FlowFixMe
    return (
      isARCondition ||
      shouldDisableARSelectors ||
      (customTipAmount &&
        fiatConversion &&
        activeTab !== TAB_FIAT &&
        (exchangeRate ? convertToTwoDecimalsOrMore(amount * exchangeRate) < customTipAmount : amount < customTipAmount))
    );
  }

  // parse number as float and sets it in the parent component
  function handleCustomPriceChange(amount: number) {
    const tipAmountValue = parseFloat(amount);
    onChange(tipAmountValue);
  }

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  React.useEffect(() => {
    let regexp;

    if (amount === 0) {
      setTipError(__('Amount cannot be zero.'));
    } else if (!amount || typeof amount !== 'number') {
      setTipError(__('Amount must be a number.'));
    } else {
      // if it's not fiat, aka it's boost or lbc tip
      if (activeTab !== TAB_FIAT) {
        if (activeTab === 'TabUSD' && (!arBalance || amountInArEstimated > arBalance)) {
          setTipError(__('Insufficient AR Balance'));
        } else if (amount < MINIMUM_PUBLISH_BID) {
          setTipError(__('Amount must be higher'));
        } else if (customTipAmount && amount < convertToTwoDecimalsOrMore(customTipAmount / arExchangeRate.ar)) {
          regexp = RegExp(/^(\d*([.]\d{0,2})?)$/);
          const validCustomTipInput = regexp.test(String(amount));

          if (validCustomTipInput) {
            setTipError(
              __('Insufficient amount (%input_amount% USD = %converted_amount% AR).', {
                input_amount: amount,
                converted_amount: convertToTwoDecimalsOrMore(amount / arExchangeRate.ar, 4),
              })
            );
          } else {
            setTipError(__('Amount must have no more than 2 decimal places'));
          }
        } else {
          setTipError(false);
        }
        //  if tip fiat tab
      } else {
        regexp = RegExp(/^(\d*([.]\d{0,2})?)$/);
        const validTipInput = regexp.test(String(amount));

        if (!validTipInput) {
          setTipError(__('Amount must have no more than 2 decimal places'));
        } else if (amount < 1) {
          setTipError(__('Amount must be at least one dollar'));
        } else if (amount > 1000) {
          setTipError(__('Amount cannot be over 1000 dollars'));
        } else if (customTipAmount && amount < customTipAmount) {
          setTipError(
            __('Amount is lower than price of $%price_amount%', {
              price_amount: convertToTwoDecimalsOrMore(customTipAmount),
            })
          );
        } else {
          setTipError(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, amount, arBalance, customTipAmount, exchangeRate, setTipError]);

  if (!claim) return null;

  const getHelpMessage = (helpMessage: any, customClassName) => (
    <div className={classnames('help', customClassName)}>{helpMessage}</div>
  );

  return (
    <>
      <div className="section">
        {tipAmountsToDisplay &&
          tipAmountsToDisplay.map((defaultAmount) => (
            <Button
              key={defaultAmount}
              disabled={shouldDisableAmountSelector(defaultAmount)}
              button="alt"
              className={classnames('button-toggle button-toggle--expandformobile', {
                'button-toggle--active':
                  convertToTwoDecimalsOrMore(defaultAmount) === convertToTwoDecimalsOrMore(amount) && !useCustomTip,
                'button-toggle--disabled':
                  (activeTab === 'TabUSDC' && (amount > USDCBalance || USDCBalance === 0)),
              })}
              label={defaultAmount}
              icon={TAB_USD}
              onClick={() => {
                handleCustomPriceChange(defaultAmount);
                setUseCustomTip(false);
              }}
            />
          ))}

        <Button
          button="alt"
          disabled={shouldDisableAmountSelector(0)}
          className={classnames('button-toggle button-toggle--expandformobile', {
            'button-toggle--active': useCustomTip,
          })}
          icon={TAB_USD}
          label={__('Custom')}
          onClick={() => setUseCustomTip(true)}
        />
      </div>

      {customTipAmount &&
        fiatConversion &&
        activeTab !== TAB_FIAT &&
        getHelpMessage(
          __('This support is priced in $USD.') +
            (' ' +
              __('The current exchange rate for the submitted USD amount is ~ %exchange_amount% AR.', {
                exchange_amount: convertToTwoDecimalsOrMore(amount / arExchangeRate.ar),
              }))
        )}

      {/* custom number input form */}
      {useCustomTip && (
        <div className="walletTipSelector__input">
          <FormField
            autoFocus={!isMobile}
            name="tip-input"
            id="tip-input"
            disabled={!customTipAmount && shouldDisableAmountSelector(0)}
            error={tipError}
            min="0"
            step="any"
            type="number"
            className={activeTab === 'TabUSD' ? 'usd-tip' : ''}
            prefix={activeTab === 'TabUSD' ? '$' : null}
            placeholder={'1.23'}
            value={amount}
            onChange={(event) => handleCustomPriceChange(event.target.value)}
          />{' '}
          {activeTab === TAB_USD ? (
            <span className={'walletTipSelector__input-conversion help'}>({amountInArEstimated} AR)</span>
          ) : (
            ''
          )}
        </div>
      )}

      {activeTab === TAB_USD && arweaveTipData && arweaveTipData.status === 'active' && (
        <WalletSpendableBalanceHelp asset="ar" />
      )}

      {/* help message */}
      {activeTab === TAB_FIAT &&
        (!canReceiveFiatTips
          ? getHelpMessage(__('Only creators that verify cash accounts can receive tips.'))
          : getHelpMessage(__('Send a tip directly from your attached card.')))}
      {activeTab === TAB_FIAT &&
        !isComment &&
        getHelpMessage(
          __(
            'IMPORTANT: this donation is sent without a comment. If you want to include a comment, click the $ next to the comment input area.'
          )
        )}
    </>
  );
}

export default WalletTipAmountSelector;
