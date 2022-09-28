// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import JoinMembershipCard from 'component/joinMembershipCard';

type Props = {
  uri: string,
  fileUri?: string,
  passedTier?: CreatorMembership,
  // -- redux --
  doHideModal: () => void,
};
class ModalJoinMembership extends React.PureComponent<Props> {
  render() {
    const { uri, fileUri, passedTier, doHideModal } = this.props;

    return (
      <Modal onAborted={doHideModal} isOpen type="card">
        <JoinMembershipCard uri={uri} doHideModal={doHideModal} passedTier={passedTier} fileUri={fileUri} />
      </Modal>
    );
  }
}

export default ModalJoinMembership;
