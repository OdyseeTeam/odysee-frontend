// @flow
import * as React from 'react';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
const moment = require('moment');

console.log(moment.duration);
let stripeEnvironment = getStripeEnvironment();

type Props = {
  channelClaimId: string,
  channelName: string,
  claim: StreamClaim,
  claimIsMine: boolean,
  doCheckIfPurchasedClaimId: (string) => void,
  doOpenModal: (string, {}) => void,
  doResolveClaimIds: (Array<string>) => Promise<any>,
  preferredCurrency: string,
  preorderContentClaim: Claim,
  preorderContentClaimId: string,
  preorderTag: number,
  purchaseMadeForClaimId: ?boolean,
  purchaseTag: string,
  uri: string,
};

export default function PreorderAndPurchaseButton(props: Props) {
  const {
    channelClaimId,
    channelName,
    claim,
    claimIsMine,
    doCheckIfPurchasedClaimId,
    doOpenModal,
    doResolveClaimIds,
    preorderContentClaim, // populates after doResolveClaimIds
    preorderContentClaimId, // full content that will be purchased
    preferredCurrency,
    preorderTag, // the price of the preorder
    purchaseMadeForClaimId,
    purchaseTag, // the price of the purchase
    rentalTag,
    uri,
  } = props;

  const [hasChargesEnabled, setHasChargesEnabled] = React.useState(false);
  const [hasCardSaved, setHasSavedCard] = React.useState(false);
  const [waitingForBackend, setWaitingForBackend] = React.useState(true);

  const myUpload = claimIsMine;

  const { price: rentalPrice, expirationTimeInSeconds: rentalExpirationTimeInSeconds  } = rentalTag;

  console.log('rental price');
  console.log(rentalPrice);

  React.useEffect(() => {
    if (preorderContentClaimId) {
      doResolveClaimIds([preorderContentClaimId]);
    }
  }, [preorderContentClaimId]);

  async function checkStripeAccountStatus() {
    const response = await Lbryio.call(
      'account',
      'check',
      {
        environment: stripeEnvironment,
        channel_claim_id: channelClaimId,
        channel_name: channelName,
      },
      'post'
    );

    if (response === true) {
      setHasChargesEnabled(true);
    }

    setWaitingForBackend(false);

    return response;
  }

  React.useEffect(() => {
    if (preorderTag || purchaseTag || rentalTag) {
      checkStripeAccountStatus();
    }
  }, [preorderTag, purchaseTag, rentalTag]);

  // check if user has a payment method saved
  React.useEffect(() => {
    Lbryio.call(
      'customer',
      'status',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((customerStatusResponse) => {
      const defaultPaymentMethodId =
        customerStatusResponse.Customer &&
        customerStatusResponse.Customer.invoice_settings &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method.id;

      setHasSavedCard(Boolean(defaultPaymentMethodId));
    });
  }, [setHasSavedCard]);

  let fiatIconToUse = ICONS.FINANCE;
  let fiatSymbol = '$';
  if (preferredCurrency === 'EUR') {
    fiatIconToUse = ICONS.EURO;
    fiatSymbol = '€';
  }

  const preorderOrPurchase = purchaseTag ? 'purchase' : 'preorder';

  let tags = {
    rentalTag,
    purchaseTag,
    preorderTag,
  }

  const canBePurchased = preorderTag || purchaseTag || rentalTag;

  return (
    <>
      {!waitingForBackend && !hasChargesEnabled && !myUpload && canBePurchased && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button non-clickable'}
            button="primary"
            label={__('Creator cannot receive payments yet')}
            style={{ opacity: 0.6 }}
          />
        </div>
      )}
      {!waitingForBackend && !hasChargesEnabled && myUpload && canBePurchased && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            button="primary"
            label={__('Setup your account to receive payments')}
            navigate={`/$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
          />
        </div>
      )}
      {!waitingForBackend && hasChargesEnabled && (
        <>
          {/* purchasable content, not preordered and still needs to be purchased */}
          {purchaseTag && !purchaseMadeForClaimId && !myUpload && !preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                icon={fiatIconToUse}
                button="primary"
                label={__('This content can be purchased for %fiatSymbol%%purchaseTag%', {
                  fiatSymbol,
                  purchaseTag,
                })}
                requiresAuth
                onClick={() =>
                  doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    purchaseTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
                    tags,
                  })
                }
              />
            </div>
          )}
          {/* purchasable content, already purchased or preordered */}
          {purchaseTag && purchaseMadeForClaimId && !myUpload && !preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                icon={fiatIconToUse}
                button="primary"
                label={__('Thanks for purchasing, enjoy your content!')}
                requiresAuth
              />
            </div>
          )}
          {/* content is available and user has ordered (redirect to content) */}
          {preorderTag && !purchaseMadeForClaimId && !myUpload && preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                button="primary"
                label={__('Click here to view your purchased content')}
                navigate={`/${preorderContentClaim.canonical_url.replace('lbry://', '')}`}
              />
            </div>
          )}
          {/* content is available and user hasn't ordered (redirect to content) */}
          {preorderTag && purchaseMadeForClaimId && !myUpload && preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                button="primary"
                label={__('Click here to view full content ')}
                navigate={`/${preorderContentClaim.canonical_url.replace('lbry://', '')}`}
              />
            </div>
          )}
          {/* viewer can preorder */}
          {preorderTag && !purchaseMadeForClaimId && !myUpload && !preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                icon={fiatIconToUse}
                button="primary"
                label={__('Preorder now for %fiatSymbol%%preorderTag%', {
                  fiatSymbol,
                  preorderTag,
                })}
                requiresAuth
                onClick={() =>
                  doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    preorderTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
                    tags,
                  })
                }
              />
            </div>
          )}
          {/* viewer can rent or purchase */}
          {rentalTag && purchaseTag && !purchaseMadeForClaimId && !myUpload && !preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                icon={fiatIconToUse}
                button="primary"
                label={__('This content can be rented for %fiatSymbol%%rentalPrice%', {
                  fiatSymbol,
                  rentalPrice,
                })}
                requiresAuth
                onClick={() =>
                  doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    purchaseTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
                    tags,
                  })
                }
              />
            </div>
          )}
          {/* viewer can rent */}
          {rentalTag && !purchaseMadeForClaimId && !myUpload && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button'}
                icon={fiatIconToUse}
                button="primary"
                label={__('Rent for %humanReadableTime% for %fiatSymbol%%rentalPrice% ', {
                  fiatSymbol,
                  rentalPrice,
                  humanReadableTime: moment(moment.duration(rentalExpirationTimeInSeconds, "seconds")).format("d [days] [and] h [hours]")
                })}
                requiresAuth
                onClick={() =>
                  doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    purchaseTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
                    tags,
                  })
                }
              />
            </div>
          )}
          {/* viewer has preordered */}
          {preorderTag && purchaseMadeForClaimId && !myUpload && !preorderContentClaim && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button non-clickable'}
                button="primary"
                label={__('You have preordered this content')}
                requiresAuth
              />
            </div>
          )}
          {/* viewer owns this content */}
          {preorderTag && myUpload && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button non-clickable'}
                button="primary"
                label={__('You cannot preorder your own content')}
              />
            </div>
          )}
          {purchaseTag && myUpload && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button non-clickable'}
                button="primary"
                label={__('You cannot purchase your own content')}
              />
            </div>
          )}
          {purchaseTag && myUpload && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button non-clickable'}
                button="primary"
                label={__('You cannot purchase your own content')}
              />
            </div>
          )}
          {purchaseTag && myUpload && (
            <div>
              <Button
                iconColor="red"
                className={'preorder-button non-clickable'}
                button="primary"
                label={__('You cannot purchase your own content')}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
