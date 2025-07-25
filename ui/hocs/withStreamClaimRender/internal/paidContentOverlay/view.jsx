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
  canReceiveTips: boolean,
  preorderTag: number,
  purchaseTag: string,
  rentalTag: RentalTagParams,
  costInfo: any,
  exchangeRate: { ar: number },
  doOpenModal: (string, {}) => void,
};

export default function PaidContentOvelay(props: Props) {
  const {
    uri,
    passClickPropsToParent,
    // --- redux ---
    preferredCurrency,
    preorderContentClaim, // populates after doResolveClaimIds
    canReceiveTips,
    preorderTag, // the price of the preorder
    purchaseTag, // the price of the purchase
    rentalTag,
    costInfo,
    exchangeRate,
    doOpenModal,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const { icon: fiatIconToUse, symbol: fiatSymbol } = STRIPE.CURRENCY[preferredCurrency];
  const sdkFeeRequired = costInfo && costInfo.cost > 0 && costInfo.feeCurrency === 'LBC';
  // setting as 0 so flow doesn't complain, better approach?
  let rentalPrice,
    rentalExpirationTimeInSeconds = 0;
  if (rentalTag) {
    rentalPrice = rentalTag.price;
    rentalExpirationTimeInSeconds = rentalTag.expirationTimeInSeconds;
  }

  const clickProps = React.useMemo(() => {
    const modalId = sdkFeeRequired && !canReceiveTips ? MODALS.AFFIRM_PURCHASE : MODALS.PREORDER_AND_PURCHASE_CONTENT;
    return isEmbed
      ? { href: `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(modalId, { uri })}` }
      : { onClick: () => doOpenModal(modalId, { uri }) };
  }, [doOpenModal, isEmbed, sdkFeeRequired, uri, canReceiveTips]);

  const ButtonPurchase = React.useMemo(() => {
    return ({ label }: { label: string }) => {
      // const clickprops = disabled ? {} : clickProps;
      return (
        <Button
          className={'purchase-button' + (sdkFeeRequired ? ' purchase-button--fee' : '')}
          icon={sdkFeeRequired && !purchaseTag ? ICONS.LBC : fiatIconToUse}
          button="primary"
          label={label}
          requiresAuth
          {...clickProps}
        />
      );
    };
  }, [clickProps, fiatIconToUse, sdkFeeRequired, purchaseTag]);

  React.useEffect(() => {
    if (passClickPropsToParent) {
      passClickPropsToParent(clickProps);
    }
  }, [clickProps, passClickPropsToParent]);

  return (
    <div className="paid-content-overlay">
      <div className="paid-content-overlay__body">
        <div className="paid-content-prompt paid-content-prompt--overlay">
          {sdkFeeRequired && canReceiveTips && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                <I18nMessage
                  tokens={{
                    currency: <Icon icon={ICONS.LBC} />,
                    amount: Number(costInfo.cost).toFixed(2),
                    fiatSymbol,
                    fiatAmount: Number(purchaseTag).toFixed(2),
                  }}
                >
                  Purchase for %fiatSymbol%%fiatAmount% or %currency%%amount%
                </I18nMessage>
              </div>

              <ButtonPurchase label={__('Purchase')} />
            </>
          )}
          {sdkFeeRequired && !canReceiveTips && (
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
                {__('Purchase for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: Number(purchaseTag).toFixed(2),
                })}{' '}
                (<Symbol token="ar" amount={Number(purchaseTag) / exchangeRate?.ar} precision={4} />)
              </div>

              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {__('Rent %duration% for %currency%%amount%', {
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                  currency: fiatSymbol,
                  amount: rentalPrice,
                })}{' '}
                (<Symbol token="ar" amount={rentalPrice / exchangeRate?.ar} precision={4} />)
              </div>
              <ButtonPurchase label={__('Purchase or Rent')} />
            </>
          )}

          {rentalTag && !purchaseTag && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {__('Rent %duration% for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: rentalPrice,
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                })}{' '}
                (<Symbol token="ar" amount={rentalPrice / exchangeRate?.ar} precision={4} />)
              </div>
              <ButtonPurchase label={__('Rent')} />
            </>
          )}
          {purchaseTag && !rentalTag && !sdkFeeRequired && (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                {__('Purchase for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: Number(purchaseTag).toFixed(2),
                })}
              </div>
              <ButtonPurchase label={__('Purchase')} />
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
                <ButtonPurchase label={__('Preorder now for %fiatSymbol%%preorderTag%', { fiatSymbol, preorderTag })} />
              )}
            </>
          )}
          {}
        </div>
      </div>
    </div>
  );
}
