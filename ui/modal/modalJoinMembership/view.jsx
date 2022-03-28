// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembership from 'component/joinMembership';

type Props = {
  uri: string,
  claimIsMine: boolean,
  isSupport: boolean,
  isTipOnly?: boolean,
  hasSelectedTab?: string,
  customText?: string,
  doHideModal: () => void,
  setAmount?: (number) => void,
};

class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, claimIsMine, isTipOnly, hasSelectedTab, customText, doHideModal, setAmount } = this.props;

    return (
      <Modal className="join-membership-modal" onAborted={doHideModal} isOpen type="card">
        <JoinMembership uri={uri} isModal />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
