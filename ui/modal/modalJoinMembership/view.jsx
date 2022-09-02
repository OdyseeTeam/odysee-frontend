// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembershipCard from 'component/joinMembershipCard';

type Props = {
  uri: string,
  // -- redux --
  doHideModal: () => void,
  membershipIndex: number,
};
class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, doHideModal, membershipIndex } = this.props;

    return (
      <Modal onAborted={doHideModal} isOpen type="card">
        <JoinMembershipCard uri={uri} doHideModal={doHideModal} membershipIndex={membershipIndex} />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
