import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  src: string;
  title: string;
  closeModal: () => void;
};

export default function ModalViewImage(props: Props) {
  const { src, title, closeModal } = props;

  return (
    <Modal className="modal-view-image lb-open-lightbox" onAborted={closeModal} isOpen type="custom">
      <div className="modal-view-image__chrome">
        <div className="modal-view-image__title" title={title}>
          {title}
        </div>
        <Button
          button="close"
          aria-label={__('Close image')}
          icon={ICONS.REMOVE}
          onClick={closeModal}
          className="modal-view-image__close"
        />
      </div>
      <div className="modal-view-image__viewport">
        <img className="modal-view-image__image" src={src} alt={title || __('Expanded image')} />
      </div>
    </Modal>
  );
}
