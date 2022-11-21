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
import I18nMessage from 'component/i18nMessage';

type RentalTagParams = { price: number, expirationTimeInSeconds: number };

type Props = {
  uri: string,
  passClickPropsToParent?: (props: { href: ?string, onClick: ?() => void }) => void,
  // --- redux ---
  preferredCurrency: string,
  preorderContentClaim: Claim,
  preorderTag: number,
  purchaseTag: string,
  rentalTag: RentalTagParams,
  costInfo: any,
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
    doOpenModal,
  } = props;

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

  const clickProps = React.useMemo(
    () => ({
      href: isEmbed && `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(MODALS.PREORDER_AND_PURCHASE_CONTENT, { uri })}`,
      onClick: !isEmbed && (() => doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, { uri })),
    }),
    [doOpenModal, isEmbed, uri]
  );

  const ButtonPurchase = React.useMemo(
    () => ({ label }: { label: string }) => (
      <Button
        className={'purchase-button' + (sdkFeeRequired ? ' purchase-button--fee' : '')}
        icon={fiatIconToUse}
        button="primary"
        label={label}
        {...clickProps}
      />
    ),
    [clickProps, fiatIconToUse, sdkFeeRequired]
  );

  React.useEffect(() => {
    if (passClickPropsToParent) {
      passClickPropsToParent(clickProps);
    }
  }, [clickProps, passClickPropsToParent]);

  return (
    <div className="paid-content-overlay">
      <div className="paid-content-overlay__body">
        <div className="paid-content-prompt paid-content-prompt--overlay">
          {sdkFeeRequired ? (
            <>
              <div className="paid-content-prompt__price">
                <Icon icon={ICONS.BUY} />
                <I18nMessage tokens={{ currency: <Icon icon={ICONS.LBC} />, amount: costInfo.cost }}>
                  Purchase for %currency%%amount%
                </I18nMessage>
              </div>

              <ButtonPurchase label={__('Purchase')} />
            </>
          ) : rentalTag && purchaseTag ? (
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
