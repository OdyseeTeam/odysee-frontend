// @flow
import 'scss/component/_wallet-tip-selector.scss';
import { FormField } from 'component/common/form';
import { MINIMUM_PUBLISH_BID } from 'constants/claim';
import { useIsMobile } from 'effects/use-screensize';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import classnames from 'classnames';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';

const DEFAULT_TIP_AMOUNTS = [1, 5, 25, 100];
const TAB_FIAT = 'TabFiat';
const TAB_LBC = 'TabLBC';

type Props = {
  uri: string,
  activeTab: string,
  amount: number,
  balance: number,
  claim: StreamClaim,
  convertedAmount?: number,
  customTipAmount?: number,
  exchangeRate?: any,
  fiatConversion?: boolean,
  tipError: string,
  uri: string,
  canReceiveFiatTips: ?boolean,
  isComment?: boolean,
  onChange: (number) => void,
  setConvertedAmount?: (number) => void,
  setDisableSubmitButton: (boolean) => void,
  setTipError: (any) => void,
  preferredCurrency: string,
  doTipAccountCheckForUri: (uri: string) => void,
};

// const STRIPE_DISABLED = true;

function WalletTipAmountSelector(props: Props) {
  const {
    uri,
    activeTab,
    amount,
    balance,
    claim,
    convertedAmount,
    customTipAmount,
    exchangeRate,
    fiatConversion,
    tipError,
    canReceiveFiatTips,
    isComment,
    onChange,
    setConvertedAmount,
    setDisableSubmitButton,
    setTipError,
    preferredCurrency,
    doTipAccountCheckForUri,
  } = props;

  const isMobile = useIsMobile();
  const [useCustomTip, setUseCustomTip] = usePersistedState('comment-support:useCustomTip', true);

  const convertToTwoDecimalsOrMore = (number: number, decimals: number = 2) =>
    Number((Math.round(number * 10 ** decimals) / 10 ** decimals).toFixed(decimals));

  const tipAmountsToDisplay =
    customTipAmount && fiatConversion && activeTab === TAB_FIAT
      ? [customTipAmount]
      : customTipAmount && exchangeRate
      ? [convertToTwoDecimalsOrMore(customTipAmount / exchangeRate)]
      : DEFAULT_TIP_AMOUNTS;

  // if it's fiat but there's no card saved OR the creator can't receive fiat tips
  const shouldDisableFiatSelectors = activeTab === TAB_FIAT && !canReceiveFiatTips;

  /**
   * whether tip amount selection/review functionality should be disabled
   * @param [amount] LBC amount (optional)
   * @returns {boolean}
   */
  function shouldDisableAmountSelector(amount: number) {
    // if it's LBC but the balance isn't enough, or fiat conditions met
    // $FlowFixMe
    return (
      ((amount > balance || balance === 0) && activeTab !== TAB_FIAT) ||
      shouldDisableFiatSelectors ||
      (customTipAmount && fiatConversion && activeTab !== TAB_FIAT && exchangeRate
        ? convertToTwoDecimalsOrMore(amount * exchangeRate) < customTipAmount
        : customTipAmount && amount < customTipAmount)
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
        } else if (amount === balance) {
          setTipError(__('Please decrease the amount to account for transaction fees'));
        } else if (amount > balance || balance === 0) {
          setTipError(__('Not enough Credits'));
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
  }, [activeTab, amount, balance, convertedAmount, customTipAmount, exchangeRate, setTipError]);

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
                'button-toggle--disabled': amount > balance,
              })}
              label={defaultAmount}
              icon={activeTab === TAB_LBC ? ICONS.LBC : fiatIconToUse}
              onClick={() => {
                handleCustomPriceChange(defaultAmount);
                setUseCustomTip(false);
              }}
            />
          ))}

        <Button
          button="alt"
          disabled={shouldDisableFiatSelectors}
          className={classnames('button-toggle button-toggle--expandformobile', {
            'button-toggle--active': useCustomTip,
          })}
          icon={activeTab === TAB_LBC ? ICONS.LBC : fiatIconToUse}
          label={__('Custom')}
          onClick={() => setUseCustomTip(true)}
        />
        {activeTab === TAB_LBC && DEFAULT_TIP_AMOUNTS.some((val) => val > balance) && (
          <Button
            icon={ICONS.REWARDS}
            button="primary"
            label={__('Receive Credits')}
            navigate={`/$/${PAGES.REWARDS}`}
          />
        )}
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
            placeholder="1.23"
            value={amount}
            onChange={(event) => handleCustomPriceChange(event.target.value)}
          />
        </div>
      )}

      {/* lbc tab */}
      {activeTab === TAB_LBC && <WalletSpendableBalanceHelp />}

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
