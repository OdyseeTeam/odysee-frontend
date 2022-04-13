// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembershipCard from 'component/creatorMemberships/joinMembershipCard';

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
        <JoinMembershipCard uri={uri} closeModal={doHideModal} />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
