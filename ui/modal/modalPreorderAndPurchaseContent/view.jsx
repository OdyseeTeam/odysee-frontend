// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import PreorderAndPurchaseContentCard from './internal/preorderAndPurchaseContentCard';

type Props = {
  uri: string,
  // -- redux --
  doHideModal: () => void,
};

class ModalPreorderContent extends React.PureComponent<Props> {
  render() {
    const { uri, doHideModal } = this.props;

    return (
      <Modal onAborted={doHideModal} ariaHideApp={false} isOpen type="card" width="wide">
        <PreorderAndPurchaseContentCard uri={uri} onCancel={doHideModal} />
      </Modal>
    );
  }
}

export default ModalPreorderContent;
