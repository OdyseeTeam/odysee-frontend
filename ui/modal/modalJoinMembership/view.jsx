// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembershipCard from 'component/joinMembershipCard';

type Props = {
  uri: string,
  passedTier?: CreatorMembership,
  // -- redux --
  doHideModal: () => void,
  membershipIndex: ?number,
  protectedMembershipIds: ?Array<number>,
};
class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, passedTier, doHideModal, membershipIndex, protectedMembershipIds } = this.props;

    return (
      <Modal onAborted={doHideModal} isOpen type="card">
        <JoinMembershipCard
          uri={uri}
          doHideModal={doHideModal}
          membershipIndex={membershipIndex}
          protectedMembershipIds={protectedMembershipIds}
          passedTier={passedTier}
        />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
