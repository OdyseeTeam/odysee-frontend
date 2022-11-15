// @flow
import * as React from 'react';

import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import { secondsToDhms } from 'util/time';
import { EmbedContext } from 'contexts/embed';
import { formatLbryUrlForWeb, getModalUrlParam } from 'util/url';

type RentalTagParams = { price: number, expirationTimeInSeconds: number };

type Props = {
  uri: string,
  // --- redux ---
  preferredCurrency: string,
  preorderContentClaim: Claim,
  preorderTag: number,
  purchaseTag: string,
  rentalTag: RentalTagParams,
  doOpenModal: (string, {}) => void,
};

export default function PaidContentOvelay(props: Props) {
  const {
    uri,
    // --- redux ---
    preferredCurrency,
    preorderContentClaim, // populates after doResolveClaimIds
    preorderTag, // the price of the preorder
    purchaseTag, // the price of the purchase
    rentalTag,
    doOpenModal,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const { icon: fiatIconToUse, symbol: fiatSymbol } = STRIPE.CURRENCY[preferredCurrency];

  // setting as 0 so flow doesn't complain, better approach?
  let rentalPrice,
    rentalExpirationTimeInSeconds = 0;
  if (rentalTag) {
    rentalPrice = rentalTag.price;
    rentalExpirationTimeInSeconds = rentalTag.expirationTimeInSeconds;
  }

  const ButtonPurchase = React.useMemo(
    () => ({ label }: { label: string }) => (
      <Button
        iconColor="red"
        className="purchase-button"
        icon={fiatIconToUse}
        button="primary"
        label={label}
        href={
          isEmbed && `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(MODALS.PREORDER_AND_PURCHASE_CONTENT, { uri })}`
        }
        onClick={!isEmbed && (() => doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, { uri }))}
      />
    ),
    [doOpenModal, fiatIconToUse, isEmbed, uri]
  );

  return (
    <div className="paid-content-overlay">
      <div className="paid-content-overlay__body">
        <div className="paid-content-prompt paid-content-prompt--overlay">
          {rentalTag && purchaseTag ? (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                {__('Purchase for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: purchaseTag,
                })}
              </div>

              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {__('Rent %duration% for %currency%%amount%', {
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                  currency: fiatSymbol,
                  amount: rentalPrice,
                })}
              </div>

              <ButtonPurchase label={__('Purchase or Rent')} />
            </>
          ) : rentalTag ? (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.TIME} />
                {__('Rent %duration% for %currency%%amount%', {
                  currency: fiatSymbol,
                  amount: rentalPrice,
                  duration: secondsToDhms(rentalExpirationTimeInSeconds),
                })}
              </div>

              <ButtonPurchase label={__('Rent')} />
            </>
          ) : purchaseTag ? (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                {__('Purchase for %currency%%amount%', { currency: fiatSymbol, amount: purchaseTag })}
              </div>

              <ButtonPurchase label={__('Purchase')} />
            </>
          ) : (
            preorderTag && (
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
                  <ButtonPurchase
                    label={__('Preorder now for %fiatSymbol%%preorderTag%', { fiatSymbol, preorderTag })}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
