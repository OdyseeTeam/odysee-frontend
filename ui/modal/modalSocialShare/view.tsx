import React from 'react';
import { Modal } from 'modal/modal';
import FileVisibility from 'component/fileVisibility';
import SocialShare from 'component/socialShare';
import Card from 'component/common/card';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
  webShareable: boolean;
  collectionId?: number;
};

function ModalSocialShare(props: Props) {
  const { uri, webShareable, collectionId } = props;
  const dispatch = useAppDispatch();

  const closeModal = () => dispatch(doHideModal());

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

export default ModalSocialShare;
