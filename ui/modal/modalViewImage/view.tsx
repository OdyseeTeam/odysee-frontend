import React from 'react';
import classnames from 'classnames';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  src: string;
  title?: string;
};

export default function ModalViewImage(props: Props) {
  const { src, title } = props;
  const dispatch = useAppDispatch();
  const [zoomed, setZoomed] = React.useState(false);
  const closeModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);
  const toggleZoom = React.useCallback(() => setZoomed((value) => !value), []);
  const resolvedTitle = title || __('Image preview');

  return (
    <Modal className="modal-view-image lb-open-lightbox" onAborted={closeModal} isOpen type="custom">
      <div className="modal-view-image__chrome">
        <div className="modal-view-image__title" title={resolvedTitle}>
          {resolvedTitle}
        </div>
        <div className="modal-view-image__actions">
          <Button
            button="link"
            href={src}
            navigateTarget="_blank"
            aria-label={__('Open original image')}
            label={__('Open original')}
            icon={ICONS.EXTERNAL}
            className="modal-view-image__action-button"
          />
          <Button
            button="link"
            aria-label={zoomed ? __('Fit image to screen') : __('Zoom image')}
            label={zoomed ? __('Fit to screen') : __('Zoom')}
            icon={zoomed ? ICONS.COMPACT : ICONS.EXPAND}
            onClick={toggleZoom}
            className="modal-view-image__action-button"
          />
          <Button
            button="close"
            aria-label={__('Close image')}
            icon={ICONS.REMOVE}
            onClick={closeModal}
            className="modal-view-image__close"
          />
        </div>
      </div>
      <div className={classnames('modal-view-image__viewport', zoomed && 'modal-view-image__viewport--zoomed')}>
        <img
          className={classnames('modal-view-image__image', zoomed && 'modal-view-image__image--zoomed')}
          src={src}
          alt={resolvedTitle}
          onClick={toggleZoom}
          title={zoomed ? __('Click to fit image to screen') : __('Click to zoom image')}
        />
      </div>
    </Modal>
  );
}
