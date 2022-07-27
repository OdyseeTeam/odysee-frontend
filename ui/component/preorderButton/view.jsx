// @flow
import * as React from 'react';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type Props = {
  preorderTag: string,
  doOpenModal: (string, {}) => void,
  claim: StreamClaim,
  uri: string,
  claimIsMine: boolean,
  preferredCurrency: string,
  preorderContentClaimId: string,
};

export default function PreorderButton(props: Props) {
  const {
    doOpenModal,
    uri,
    claim,
    claimIsMine,
    preferredCurrency,
    doResolveClaimIds,
    preorderContentClaim, // populates after doResolveClaimIds
    preorderContentClaimId, // full content that will be purchased
    preorderTag, // the price of the preorder
    purchaseTag, // the price of the purchase
    preorderedTag, // the claim id of the preorder claim
  } = props;

  const claimId = claim.claim_id;
  const myUpload = claimIsMine;

  const [hasAlreadyPreordered, setHasAlreadyPreordered] = React.useState(false);

  React.useEffect(() => {
    if (preorderContentClaimId) {
      doResolveClaimIds([preorderContentClaimId]);
    }
  }, [preorderContentClaimId]);

  // TODO: brush up this functionality
  function getPaymentHistory() {
    return Lbryio.call(
      'customer',
      'list',
      {
        environment: stripeEnvironment,
        type_filter: 'purchase',
        target_claim_id_filter: claimId,
      },
      'post'
    );
  }

  // TODO: brush up this functionality
  async function checkIfAlreadyPurchased() {
    console.log('checking if purchased');

    try {
      // get card payments customer has made
      const customerTransactionResponse = await getPaymentHistory();

      // if they have a transaction for this claim already, assume it's a preorder
      // note: this *could* be spoofed, because it doesn't check versus the amount,
      // but should be OK for now
      if (customerTransactionResponse?.length) {
        for (const transaction of customerTransactionResponse) {
          if (claimId === transaction.source_claim_id) {
            setHasAlreadyPreordered(true);
            break;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  let fiatIconToUse = ICONS.FINANCE;
  let fiatSymbolToUse = '$';
  if (preferredCurrency === 'EUR') {
    fiatIconToUse = ICONS.EURO;
    fiatSymbolToUse = '€';
  }

  // populate customer payment data
  React.useEffect(() => {
    console.log('starting the check now');
    checkIfAlreadyPurchased();
  }, [claimId]);

  let preorderOrPurchase;
  let pastTense;
  if(purchaseTag){
    preorderOrPurchase = 'purchase'
    pastTense = 'purchasing'
  } else {
    preorderOrPurchase = 'preorder'
    pastTense = 'preordering'
  }

  return (
    <>
      {/* TODO: finish the frontend (you have purchased, you can purchase)*/}
      {purchaseTag && !hasAlreadyPreordered && !myUpload && !preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            icon={fiatIconToUse}
            button="primary"
            label={__('This content can be purchased for $' + purchaseTag, {
              fiatSymbolToUse,
              preorderTag,
            })}
            requiresAuth
            onClick={() => doOpenModal(MODALS.PREORDER_CONTENT, {
              uri,
              checkIfAlreadyPurchased,
              preorderOrPurchase,
              purchaseTag
            })}
          />
        </div>
      )}
      {/* purchasable content, already purchased or preordered, )*/}
      {purchaseTag && hasAlreadyPreordered && !myUpload && !preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            icon={fiatIconToUse}
            button="primary"
            label={__(`Thanks for ${pastTense}, enjoy your content! (No expiry date)`, {
              fiatSymbolToUse,
              preorderTag,
            })}
            requiresAuth
          />
        </div>
      )}
      {/* content is available and user has ordered (redirect to content) */}
      {preorderTag && !hasAlreadyPreordered && !myUpload && preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            button="primary"
            label={__('This content is now available, click here to view it')}
            navigate={`/${preorderContentClaim.canonical_url.replace('lbry://', '')}`}
          />
        </div>
      )}
      {/* content is available and user hasn't ordered (redirect to content) */}
      {preorderTag && hasAlreadyPreordered && !myUpload && preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            button="primary"
            label={__('Your preordered content is now available, click here to view it')}
            navigate={`/${preorderContentClaim.canonical_url.replace('lbry://', '')}`}
          />
        </div>
      )}
      {/* viewer can preorder */}
      {preorderTag && !hasAlreadyPreordered && !myUpload && !preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
            icon={fiatIconToUse}
            button="primary"
            label={__('Preorder now for %fiatSymbolToUse%%preorderTag%', {
              fiatSymbolToUse,
              preorderTag,
            })}
            requiresAuth
            onClick={() => doOpenModal(MODALS.PREORDER_CONTENT, {
              uri,
              checkIfAlreadyPurchased,
              preorderOrPurchase,
              preorderTag
            })}
          />
        </div>
      )}
      {/* viewer has preordered */}
      {preorderTag && hasAlreadyPreordered && !myUpload && !preorderContentClaim && (
        <div>
          <Button
            iconColor="red"
            className={'preorder-button'}
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
            className={'preorder-button'}
            button="primary"
            label={__('You cannot preorder your own content')}
          />
        </div>
      )}
    </>
  );
}
