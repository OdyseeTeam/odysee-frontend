// MODALS.FEATURED_CHANNELS_EDIT
import React from 'react';
import './style.scss';
import FeaturedChannelsEdit from 'component/channelSections/FeaturedChannelsEdit';
import { Modal } from 'modal/modal';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  channelId: string;
  sectionId?: string;
};

export default function ModalFeaturedChannelsEdit(props: Props) {
  const { channelId, sectionId } = props;
  const dispatch = useAppDispatch();
  const hideModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);

  return (
    <Modal isOpen type="custom" width="wide-fixed" className="modal-featured-channels-edit">
      <FeaturedChannelsEdit channelId={channelId} sectionId={sectionId} onSave={hideModal} onCancel={hideModal} />
    </Modal>
  );
}
