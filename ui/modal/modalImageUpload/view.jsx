// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import SelectAsset from 'component/selectAsset';

type Props = {
  closeModal: () => void,
  currentValue: string,
  otherValue: ?string,
  title: string,
  helpText: string,
  onUpdate: (string, boolean) => void,
  assetName: string,
};

function ModalImageUpload(props: Props) {
  const { closeModal, currentValue, otherValue, title, assetName, helpText, onUpdate } = props;

  return (
    <Modal isOpen type="card" onAborted={closeModal} contentLabel={title} disableOutsideClick>
      <SelectAsset
        onUpdate={(a, b) => onUpdate(a, b)}
        currentValue={currentValue}
        otherValue={otherValue}
        assetName={assetName}
        recommended={helpText}
        onDone={closeModal}
      />
    </Modal>
  );
}

export default ModalImageUpload;
