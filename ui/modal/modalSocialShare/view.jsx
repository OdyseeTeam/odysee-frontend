// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import FileVisibility from 'component/fileVisibility';
import SocialShare from 'component/socialShare';
import Card from 'component/common/card';

type Props = {
  closeModal: () => void,
  uri: string,
  webShareable: boolean,
  collectionId?: number,
};

class ModalSocialShare extends React.PureComponent<Props> {
  render() {
    const { closeModal, uri, webShareable, collectionId } = this.props;
    return (
      <Modal isOpen onAborted={closeModal} type="card">
        <Card
          className="card--share"
          title={
            <>
              {__('Share')}
              <FileVisibility uri={uri} />
            </>
          }
          actions={<SocialShare uri={uri} webShareable={webShareable} collectionId={collectionId} />}
        />
      </Modal>
    );
  }
}

export default ModalSocialShare;
