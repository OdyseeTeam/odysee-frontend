// @flow
import * as React from 'react';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

type Props = {
  preorderTag: number,
  doOpenModal: (string, {}) => void,
  claim: StreamClaim,
  uri: string,
  claimIsMine: boolean,
  // preferredCurrency: string,
  preorderContentClaimId: string,
  doResolveClaimIds: (Array<string>) => Promise<any>,
  preorderContentClaim: Claim,
  purchaseTag: string,
  purchaseMadeForClaimId: ?boolean,
  doCheckIfPurchasedClaimId: (string) => void,
  channelClaimId: string,
  channelName: string,
};

export default function PreorderButton(props: Props) {
  const {
    doOpenModal,
    uri,
    claim,
    claimIsMine,
    // preferredCurrency,
    doResolveClaimIds,
    doCheckIfPurchasedClaimId,
    preorderContentClaim, // populates after doResolveClaimIds
    preorderContentClaimId, // full content that will be purchased
    preorderTag, // the price of the preorder
    purchaseTag, // the price of the purchase
    purchaseMadeForClaimId,
    channelClaimId,
    channelName,
  } = props;

  const [hasChargesEnabled, setHasChargesEnabled] = React.useState(false);
  const [hasCardSaved, setHasSavedCard] = React.useState(false);
  const [waitingForBackend, setWaitingForBackend] = React.useState(true);

  const myUpload = claimIsMine;

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
    if (preorderTag || purchaseTag) {
      checkStripeAccountStatus();
    }
  }, [preorderTag, purchaseTag]);

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
  // hardcore to USD for now
  // if (preferredCurrency === 'EUR') {
  //   fiatIconToUse = ICONS.EURO;
  //   fiatSymbol = '€';
  // }

  const preorderOrPurchase = purchaseTag ? 'purchase' : 'preorder';

  const canBePurchased = preorderTag || purchaseTag;

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
                  doOpenModal(MODALS.PREORDER_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    purchaseTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
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
                  doOpenModal(MODALS.PREORDER_CONTENT, {
                    uri,
                    preorderOrPurchase,
                    preorderTag,
                    doCheckIfPurchasedClaimId,
                    claimId: claim.claim_id,
                    hasCardSaved,
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
        </>
      )}
    </>
  );
}
