// @flow
import * as React from 'react';

type Props = {
  preorderTag: string,
  purchaseTag: string,
  preorderContentClaimId: string,
};

export default function PreviewOverlayProperties(props: Props) {
  const { preorderTag, purchaseTag, preorderContentClaimId } = props;

  const preorderOrPurchase = purchaseTag ? 'Purchase' : 'Preorder';
  const tagToUse = purchaseTag || (!preorderContentClaimId && preorderTag);

  return (
    <>
      {tagToUse && (
        <>
          <div className="claim-preview__file-purchase-overlay">
            <div className="claim-preview__overlay-properties">
              <span>
                {preorderOrPurchase} for ${tagToUse}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
