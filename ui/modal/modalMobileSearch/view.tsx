import React from 'react';
import { Modal } from 'modal/modal';
import WunderbarSuggestions from 'component/wunderbarSuggestions';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';

type Props = {
  channelsOnly?: boolean;
  noTopSuggestion?: boolean;
  noBottomLinks?: boolean;
  customSelectAction?: (arg0: string) => void;
};

export default function ModalMobileSearch(props: Props) {
  const { channelsOnly, noTopSuggestion, noBottomLinks, customSelectAction } = props;
  const dispatch = useAppDispatch();
  const closeModal = React.useCallback(() => dispatch(doHideModal()), [dispatch]);

  return (
    <Modal onAborted={closeModal} isOpen type="card">
      <WunderbarSuggestions
        isMobile
        channelsOnly={channelsOnly}
        noTopSuggestion={noTopSuggestion}
        noBottomLinks={noBottomLinks}
        customSelectAction={customSelectAction}
      />
    </Modal>
  );
}
