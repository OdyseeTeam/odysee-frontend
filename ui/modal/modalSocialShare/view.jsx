// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import SocialShare from 'component/socialShare';
import Card from 'component/common/card';

type Props = {
  closeModal: () => void,
  uri: string,
  webShareable: boolean,
  collectionId?: number,
  showEmbedButton: boolean,
};

class ModalSocialShare extends React.PureComponent<Props> {
  render() {
    const { closeModal, uri, webShareable, collectionId, showEmbedButton = true } = this.props;

    console.log('show embed button2');
    console.log(showEmbedButton);
    return (
      <Modal isOpen onAborted={closeModal} type="card">
        <Card
          title={__('Share')}
          actions={<SocialShare uri={uri} webShareable={webShareable} collectionId={collectionId} showEmbedButton />}
        />
      </Modal>
    );
  }
}

export default ModalSocialShare;
