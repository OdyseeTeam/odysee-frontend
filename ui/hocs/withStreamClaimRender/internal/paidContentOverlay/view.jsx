// @flow
import * as React from 'react';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import { secondsToDhms } from 'util/time';
import { EmbedContext } from 'contexts/embed';
import { formatLbryUrlForWeb, getModalUrlParam } from 'util/url';
import I18nMessage from 'component/i18nMessage';
import Symbol from 'component/common/symbol';

type RentalTagParams = { price: number, expirationTimeInSeconds: number };

type Props = {
  uri: string,
  passClickPropsToParent?: (props: { href?: string, onClick?: () => void }) => void,
  // --- redux ---
  preferredCurrency: string,
  preorderContentClaim: Claim,
  preorderTag: number,
  purchaseTag: string,
  rentalTag: RentalTagParams,
  costInfo: any,
  exchangeRate: { ar: number },
  balance: ArweaveBalance,
  doOpenModal: (string, {}) => void,
};

export default function PaidContentOvelay(props: Props) {
  const {
    uri,
    passClickPropsToParent,
    // --- redux ---
    preferredCurrency,
    preorderContentClaim, // populates after doResolveClaimIds
    preorderTag, // the price of the preorder
    purchaseTag, // the price of the purchase
    rentalTag,
    costInfo,
    exchangeRate,
    balance,
    doOpenModal,
  } = props;
  const { ar: arBalance } = balance;
  const { ar: dollarsPerAr } = exchangeRate;

  const cantAffordPreorder = preorderTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < preorderTag);
  const cantAffordRent = rentalTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < rentalTag);
  const cantAffordPurchase = purchaseTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < purchaseTag);
  const getCanAffordOne = () => {
    if (rentalTag && !cantAffordRent) {
      return true;
    }

    if (purchaseTag && !cantAffordPurchase) {
      return true;
    }

    if (preorderTag && !cantAffordPreorder) {
      return true;
    }
    return false;
  };
  const canAffordOne = getCanAffordOne();

  const isEmbed = React.useContext(EmbedContext);

  const { icon: fiatIconToUse, symbol: fiatSymbol } = STRIPE.CURRENCY[preferredCurrency];
  const sdkFeeRequired = costInfo && costInfo.cost > 0;

  // setting as 0 so flow doesn't complain, better approach?
  let rentalPrice,
    rentalExpirationTimeInSeconds = 0;
  if (rentalTag) {
    rentalPrice = rentalTag.price;
    rentalExpirationTimeInSeconds = rentalTag.expirationTimeInSeconds;
  }

  const clickProps = React.useMemo(() => {
    const modalId = sdkFeeRequired ? MODALS.AFFIRM_PURCHASE : MODALS.PREORDER_AND_PURCHASE_CONTENT;
    return isEmbed
      ? { href: `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(modalId, { uri })}` }
      : { onClick: () => doOpenModal(modalId, { uri }) };
  }, [doOpenModal, isEmbed, sdkFeeRequired, uri]);

  const ButtonPurchase = React.useMemo(() => {
    return ({ label, disabled }: { label: string, disabled: boolean }) => {
      // const clickprops = disabled ? {} : clickProps;
      return (
        <Button
          className={'purchase-button' + (sdkFeeRequired ? ' purchase-button--fee' : '')}
          icon={sdkFeeRequired ? ICONS.LBC : fiatIconToUse}
          button="primary"
          label={label}
          requiresAuth
          disabled={disabled}
          {...clickProps}
        />
      );
    };
  }, [clickProps, fiatIconToUse, sdkFeeRequired]);

  React.useEffect(() => {
    if (passClickPropsToParent && canAffordOne) {
      passClickPropsToParent(clickProps);
    }
  }, [clickProps, passClickPropsToParent, canAffordOne]);

  return (
    <div className="paid-content-overlay">
      <div className="paid-content-overlay__body">
        <div className="paid-content-prompt paid-content-prompt--overlay">
          {sdkFeeRequired && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                <I18nMessage tokens={{ currency: <Icon icon={ICONS.LBC} />, amount: Number(costInfo.cost).toFixed(2) }}>
                  Purchase for %currency%%amount%
                </I18nMessage>
              </div>
              <ButtonPurchase label={__('Purchase')} />
            </>
          )}
          {rentalTag && purchaseTag && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                {cantAffordPurchase && __('Insufficient funds to')}{cantAffordPurchase && ' '}
                {__('Purchase for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: Number(purchaseTag).toFixed(2),
                })}{' '}
                (<Symbol token="ar" amount={Number(purchaseTag) / exchangeRate?.ar} precision={4} />)
              </div>

              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {cantAffordRent && __('Insufficient funds to')}{cantAffordRent && ' '}
                {__('Rent %duration% for %currency%%amount%', {
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                  currency: fiatSymbol,
                  amount: rentalPrice,
                })}{' '}
                (<Symbol token="ar" amount={rentalPrice / exchangeRate?.ar} precision={4} />)
              </div>
              <ButtonPurchase disabled={cantAffordRent && cantAffordPurchase} label={__('Purchase or Rent')} />
            </>
          )}

          {rentalTag && !purchaseTag && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {cantAffordRent && __('Insufficient funds to')}{cantAffordRent && ' '}
                {__('Rent %duration% for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: rentalPrice,
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                })}{' '}
                (<Symbol token="ar" amount={rentalPrice * exchangeRate?.ar} precision={4} />)
              </div>
              <ButtonPurchase disabled={cantAffordRent} label={__('Rent')} />
              {cantAffordRent && <div className={'error'}>Insufficient Funds</div>}
            </>
          )}
          {purchaseTag && !rentalTag && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                {cantAffordPurchase && __('Insufficient funds to')}{cantAffordPurchase && ' '}
                {__('Purchase for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: Number(purchaseTag).toFixed(2),
                })}
              </div>

              {!cantAffordPurchase && <ButtonPurchase disabled={cantAffordPurchase} label={__('Purchase')} />}
              {cantAffordPurchase && <div className={'error'}>Insufficient Funds</div>}
            </>
          )}
          {preorderTag && (
            <>
              {preorderContentClaim ? (
                <Button
                  iconColor="red"
                  className={'preorder-button'}
                  button="primary"
                  label={__('Click here to view your purchased content')}
                  navigate={`/${preorderContentClaim.canonical_url.replace('lbry://', '')}`}
                />
              ) : (
                <ButtonPurchase disabled={cantAffordPreorder} label={__('Preorder now for %fiatSymbol%%preorderTag%', { fiatSymbol, preorderTag })} />
              )}
            </>
          )}
          {}
        </div>
      </div>
    </div>
  );
}
