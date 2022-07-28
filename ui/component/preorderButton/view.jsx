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

  const [hasAlreadyPreorderedOrPurchased, setHasAlreadyPreorderedOrPurchased] = React.useState(false);

  React.useEffect(() => {
    if (preorderContentClaimId) {
      doResolveClaimIds([preorderContentClaimId]);
    }
  }, [preorderContentClaimId]);

  // TODO: how to know whether to check for reference or target?
  function checkForPurchaseOrPreorder() {
    // we'll check if there's anything for the targeted id
    // if we're on a preorder and there is, build the purchase url with the reference (if exists)
    // if we're on a purchase and there is, show the video
    return Lbryio.call(
      'customer',
      'list',
      {
        environment: stripeEnvironment,
        target_claim_id_filter: claimId,
      },
      'post'
    );
  }

  async function checkIfAlreadyPurchasedOrPreordered() {
    try {
      // get card payments customer has made
      const existingPurchaseOrPreorder = await checkForPurchaseOrPreorder();

      if (existingPurchaseOrPreorder && existingPurchaseOrPreorder.length) setHasAlreadyPreorderedOrPurchased(true);
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
    checkIfAlreadyPurchasedOrPreordered();
  }, [claimId]);

  let preorderOrPurchase;
  let pastTense;
  if (purchaseTag) {
    preorderOrPurchase = 'purchase';
    pastTense = 'purchasing';
  } else {
    preorderOrPurchase = 'preorder';
    pastTense = 'preordering';
  }

  return (
    <>
      {/* purchasable content, not preordered and still needs to be purchased */}
      {purchaseTag && !hasAlreadyPreorderedOrPurchased && !myUpload && !preorderContentClaim && (
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
              checkIfAlreadyPurchasedOrPreordered,
              preorderOrPurchase,
              purchaseTag,
            })}
          />
        </div>
      )}
      {/* purchasable content, already purchased or preordered */}
      {purchaseTag && hasAlreadyPreorderedOrPurchased && !myUpload && !preorderContentClaim && (
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
      {preorderTag && !hasAlreadyPreorderedOrPurchased && !myUpload && preorderContentClaim && (
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
      {preorderTag && hasAlreadyPreorderedOrPurchased && !myUpload && preorderContentClaim && (
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
      {preorderTag && !hasAlreadyPreorderedOrPurchased && !myUpload && !preorderContentClaim && (
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
              checkIfAlreadyPurchasedOrPreordered,
              preorderOrPurchase,
              preorderTag,
            })}
          />
        </div>
      )}
      {/* viewer has preordered */}
      {preorderTag && hasAlreadyPreorderedOrPurchased && !myUpload && !preorderContentClaim && (
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
