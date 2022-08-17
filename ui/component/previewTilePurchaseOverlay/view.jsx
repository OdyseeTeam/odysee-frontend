// @flow
import * as React from 'react';

type Props = {
  preorderTag: string,
  purchaseTag: string,
  rentalTag: string,
  preorderContentClaimId: string,
};

export default function PreviewTilePurchaseOverlay(props: Props) {
  const { preorderTag, purchaseTag, rentalTag, preorderContentClaimId } = props;

  let actionTag;
  let price;
  if(purchaseTag){
    actionTag = 'Purchase';
    price = purchaseTag;
  } else if (preorderTag){
    actionTag = 'Preorder';
    price = preorderTag;
  } else if (rentalTag){
    actionTag = 'Rent';
    price = rentalTag.price;
  }

  const tagToUse =
    purchaseTag ||
    (preorderTag && !preorderContentClaimId) || // preorder but doesn't have a linked claim
    rentalTag;

  return (
    <>
      {tagToUse && (
        <>
          <div className="claim-preview__file-purchase-overlay">
            <div className="claim-preview__overlay-properties">
              <span>
                {actionTag} for ${price}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
