// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembership from 'component/memberships/joinMembership';

type Props = {
  uri: string,
  claimIsMine: boolean,
  doHideModal: () => void,
};

class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, doHideModal } = this.props;

    return (
      <Modal className="join-membership-modal" onAborted={doHideModal} isOpen type="card">
        <JoinMembership uri={uri} closeModal={doHideModal} isModal />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
