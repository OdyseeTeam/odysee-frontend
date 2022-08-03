// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import PreorderContent from 'component/preorderContent';

type Props = {
  uri: string,
  checkIfAlreadyPurchasedOrPreordered: () => void,
  preorderOrPurchase: string,
  preorderTag: number,
  purchaseTag: number,
  doHideModal: () => void,
  checkIfAlreadyPurchased: () => void,
  claimId: string,
  doCheckIfPurchasedClaimId: (string) => void,
  hasCardSaved: boolean,
};

class ModalPreorderContent extends React.PureComponent<Props> {
  render() {
    const {
      uri,
      doHideModal,
      preorderOrPurchase,
      preorderTag,
      purchaseTag,
      doCheckIfPurchasedClaimId,
      claimId,
      hasCardSaved,
    } = this.props;

    return (
      <Modal onAborted={doHideModal} ariaHideApp={false} isOpen type="card">
        <PreorderContent
          uri={uri}
          onCancel={doHideModal}
          preorderOrPurchase={preorderOrPurchase}
          preorderTag={preorderTag}
          purchaseTag={purchaseTag}
          doCheckIfPurchasedClaimId={doCheckIfPurchasedClaimId}
          claimId={claimId}
          hasCardSaved={hasCardSaved}
        />
      </Modal>
    );
  }
}

export default ModalPreorderContent;
