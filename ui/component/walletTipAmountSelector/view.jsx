// @flow
import React from 'react';
import 'scss/component/_wallet-tip-selector.scss';
import { FormField } from 'component/common/form';
import { MINIMUM_PUBLISH_BID } from 'constants/claim';
import { useIsMobile } from 'effects/use-screensize';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import classnames from 'classnames';
import usePersistedState from 'effects/use-persisted-state';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import { TAB_LBC, TAB_USDC, TAB_FIAT, TAB_USD, TAB_BOOST } from 'constants/tip_tabs';

const DEFAULT_TIP_AMOUNTS = [1, 5, 25, 100];

type Props = {
  uri: string,
  activeTab: string,
  amount: number,
  LBCBalance: number,
  USDCBalance: number,
  arBalance: number,
  claim: StreamClaim,
  convertedAmount?: number,
  customTipAmount?: number,
  exchangeRate?: any,
  fiatConversion?: boolean,
  tipError: string,
  uri: string,
  canReceiveFiatTips: ?boolean,
  arweaveTipData: ArweaveTipDataForId,
  isComment?: boolean,
  onChange: (number) => void,
  setConvertedAmount?: (number) => void,
  setDisableSubmitButton: (boolean) => void,
  setTipError: (any) => void,
  preferredCurrency: string,
  doTipAccountCheckForUri: (uri: string) => void,
  doArConnect: () => void,
  dollarsPerAr: number,
  arExchangeRate: any;
  exchangeRateOverride?: number,
};

// const STRIPE_DISABLED = true;

function WalletTipAmountSelector(props: Props) {
  const {
    uri,
    activeTab,
    amount,
    LBCBalance,
    USDCBalance,
    arBalance,
    claim,
    convertedAmount,
    customTipAmount,
    exchangeRate,
    fiatConversion,
    tipError,
    canReceiveFiatTips,
    arweaveTipData,
    isComment,
    onChange,
    setConvertedAmount,
    setDisableSubmitButton,
    setTipError,
    preferredCurrency,
    doTipAccountCheckForUri,
    doArConnect,
    dollarsPerAr,
    arExchangeRate,
    exchangeRateOverride,
  } = props;
  

  const USDBalance = arBalance * arExchangeRate?.ar;
  const isMobile = useIsMobile();
  const [useCustomTip, setUseCustomTip] = usePersistedState('comment-support:useCustomTip', true);

  const dollarsPerArToUse = exchangeRateOverride || dollarsPerAr;
  const convertToTwoDecimalsOrMore = (number: number, decimals: number = 2) =>
    Number((Math.round(number * 10 ** decimals) / 10 ** decimals).toFixed(decimals));
  const amountInArEstimated = (amount / dollarsPerArToUse).toFixed(6);

  const tipAmountsToDisplay =
    customTipAmount && fiatConversion && activeTab === TAB_FIAT
      ? [customTipAmount]
      : customTipAmount && exchangeRate
      ? [convertToTwoDecimalsOrMore(customTipAmount / exchangeRate)]
      : DEFAULT_TIP_AMOUNTS;

  // if it's fiat but there's no card saved OR the creator can't receive fiat tips
  const shouldDisableFiatSelectors = activeTab === TAB_FIAT && !canReceiveFiatTips;
  const shouldDisableUSDCSelectors =
    activeTab === TAB_USDC && (!arweaveTipData || (arweaveTipData && arweaveTipData.status !== 'active'));
  const shouldDisableARSelectors =
    activeTab === TAB_USD && (!arweaveTipData || (arweaveTipData && arweaveTipData.status !== 'active'));

  /**
   * whether tip amount selection/review functionality should be disabled
   * @param [amount] LBC amount (optional)
   * @returns {boolean}
   */
  function shouldDisableAmountSelector(amount: number) {
    const isLBCCondition = activeTab === TAB_LBC && (amount > LBCBalance || LBCBalance === 0);
    const isUSDCCondition = activeTab === TAB_USDC && (amount > USDCBalance || USDCBalance === 0);
    // const isARCondition = activeTab === TAB_USD && (amount > arBalance || arBalance === 0);
    const isARCondition = activeTab === TAB_USD && (amount > USDBalance || USDBalance === 0);

    const isNotFiatTab = activeTab !== TAB_FIAT;

    // if it's LBC but the balance isn't enough, or fiat conditions met
    // $FlowFixMe
    return (
      ((isLBCCondition || isUSDCCondition || isARCondition) && isNotFiatTab) ||
      shouldDisableFiatSelectors ||
      shouldDisableARSelectors ||
      shouldDisableUSDCSelectors ||
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
    if (fiatConversion && exchangeRate && setConvertedAmount && convertedAmount !== tipAmountValue * exchangeRate) {
      setConvertedAmount(tipAmountValue * exchangeRate);
    }
  }

  React.useEffect(() => {
    if (setDisableSubmitButton) setDisableSubmitButton(shouldDisableFiatSelectors);
  }, [setDisableSubmitButton, shouldDisableFiatSelectors]);

  React.useEffect(() => {
    if (setConvertedAmount && exchangeRate && (!convertedAmount || convertedAmount !== amount * exchangeRate)) {
      setConvertedAmount(amount * exchangeRate);
    }
  }, [amount, convertedAmount, exchangeRate, setConvertedAmount]);

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
        regexp = RegExp(/^(\d*([.]\d{0,8})?)$/);
        const validTipInput = regexp.test(String(amount));

        if (!validTipInput) {
          setTipError(__('Amount must have no more than 8 decimal places'));
        } else if (amount === LBCBalance) {
          setTipError(__('Please decrease the amount to account for transaction fees'));
        } else if (activeTab === 'TabLBC' && (amount > LBCBalance || LBCBalance === 0)) {
          setTipError(__('Not enough Credits'));
        } else if (activeTab === 'TabUSDC' && (amount > USDCBalance || USDCBalance === 0)) {
          setTipError(__('Not enough USDC'));
        } else if (activeTab === 'TabUSD' && (!arBalance || amountInArEstimated > arBalance)) {
          setTipError(__('Insufficient AR Balance'));
        } else if (amount < MINIMUM_PUBLISH_BID) {
          setTipError(__('Amount must be higher'));
        } else if (
          convertedAmount &&
          exchangeRate &&
          customTipAmount &&
          amount < convertToTwoDecimalsOrMore(customTipAmount / exchangeRate)
        ) {
          regexp = RegExp(/^(\d*([.]\d{0,2})?)$/);
          const validCustomTipInput = regexp.test(String(amount));

          if (validCustomTipInput) {
            setTipError(
              __('Insufficient amount (%input_amount% Credits = %converted_amount% USD).', {
                input_amount: amount,
                converted_amount: convertToTwoDecimalsOrMore(convertedAmount, 4),
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
  }, [activeTab, amount, LBCBalance, arBalance, USDCBalance, convertedAmount, customTipAmount, exchangeRate, setTipError]);

  if (!claim) return null;

  const getHelpMessage = (helpMessage: any, customClassName) => (
    <div className={classnames('help', customClassName)}>{helpMessage}</div>
  );

  let fiatIconToUse = ICONS.FINANCE;
  if (preferredCurrency === 'EUR') fiatIconToUse = ICONS.EURO;

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
                  (activeTab === 'TabLBC' && amount > LBCBalance) ||
                  (activeTab === 'TabUSDC' && (amount > USDCBalance || USDCBalance === 0)),
              })}
              label={defaultAmount}
              icon={
                activeTab === TAB_USDC
                  ? ICONS.USDC
                  : activeTab === TAB_USD
                  ? ICONS.USD
                  : activeTab === TAB_LBC
                  ? ICONS.LBC
                  : ICONS.USD
              } /* here */
              onClick={() => {
                handleCustomPriceChange(defaultAmount);
                setUseCustomTip(false);
              }}
            />
          ))}

        <Button
          button="alt"
          disabled={shouldDisableFiatSelectors || shouldDisableAmountSelector(0)}
          className={classnames('button-toggle button-toggle--expandformobile', {
            'button-toggle--active': useCustomTip,
          })}
          icon={
            activeTab === TAB_USDC
              ? ICONS.USDC
              : activeTab === TAB_USD
              ? ICONS.USD
              : activeTab === TAB_LBC
              ? ICONS.LBC
              : ICONS.USD
          }
          label={__('Custom')}
          onClick={() => setUseCustomTip(true)}
        />
        {/* activeTab === TAB_LBC && DEFAULT_TIP_AMOUNTS.some((val) => val > LBCBalance) && (
          <Button
            icon={ICONS.REWARDS}
            button="primary"
            label={__('Receive Credits')}
            navigate={`/$/${PAGES.REWARDS}`}
          />
        ) */}
      </div>

      {customTipAmount &&
        fiatConversion &&
        activeTab !== TAB_FIAT &&
        getHelpMessage(
          __('This support is priced in $USD.') +
            (convertedAmount
              ? ' ' +
                __('The current exchange rate for the submitted LBC amount is ~ $%exchange_amount%.', {
                  exchange_amount: convertToTwoDecimalsOrMore(convertedAmount),
                })
              : '')
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
            <span className={'walletTipSelector__input-conversion help'}>
              ({arExchangeRate?.ar} AR)
            </span>
          ) : ''}
        </div>
      )}
      {activeTab === TAB_USDC &&
        (!arweaveTipData || (arweaveTipData && arweaveTipData.status !== 'active')) &&
        getHelpMessage(__('Only creators that onboard with USDC can receive USDC tips.'))}

      {activeTab === TAB_USDC && arweaveTipData && arweaveTipData.status === 'active' && (
        <WalletSpendableBalanceHelp asset="usdc" />
      )}

      {activeTab === TAB_USD && arweaveTipData && arweaveTipData.status === 'active' && (
        <WalletSpendableBalanceHelp asset="ar" />
      )}

      {/* lbc tab */}
      {activeTab === TAB_LBC && <WalletSpendableBalanceHelp asset="lbc" />}

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
