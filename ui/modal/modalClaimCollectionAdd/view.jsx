// @flow
import React from 'react';
import ClaimCollectionAdd from './internal/claimCollectionAdd';
import { Modal } from 'modal/modal';

type Props = {
  uri: string,
  doHideModal: () => void,
  doToast: (props: { message: string }) => void,
};

export const ModalClaimCollectionAddContext = React.createContext<any>();

const ModalClaimCollectionAdd = (props: Props) => {
  const { uri, doHideModal, doToast } = props;

  const [collectionsAdded, setCollectionsAdded] = React.useState([]);

  function handleClose() {
    if (collectionsAdded.length > 0) {
      doToast({ message: __('Added to %playlist_names%', { playlist_names: collectionsAdded.join(',') }) });
    }
    doHideModal();
  }

  return (
    <Modal isOpen type="card" onAborted={handleClose}>
      <ModalClaimCollectionAddContext.Provider value={{ collectionsAdded, setCollectionsAdded }}>
        <ClaimCollectionAdd uri={uri} closeModal={handleClose} setCollectionsAdded={setCollectionsAdded} />
      </ModalClaimCollectionAddContext.Provider>
    </Modal>
  );
};

export default ModalClaimCollectionAdd;
