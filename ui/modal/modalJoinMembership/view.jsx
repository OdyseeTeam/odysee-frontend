// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembership from 'component/creatorMemberships/joinMembershipCard';

type Props = {
  uri: string,
  // -- redux --
  doHideModal: () => void,
};

class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, doHideModal } = this.props;

    return (
      <Modal onAborted={doHideModal} isOpen type="card">
        <JoinMembership uri={uri} closeModal={doHideModal} isModal />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
