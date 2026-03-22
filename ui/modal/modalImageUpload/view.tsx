import React from 'react';
import { Modal } from 'modal/modal';
import SelectAsset from 'component/selectAsset';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
type Props = {
  currentValue: string;
  otherValue: string | null | undefined;
  title: string;
  helpText: string;
  onUpdate: (arg0: string, arg1: boolean) => void;
  assetName: string;
};

function ModalImageUpload(props: Props) {
  const { currentValue, otherValue, title, assetName, helpText, onUpdate } = props;
  const dispatch = useAppDispatch();
  const closeModal = () => dispatch(doHideModal());
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
