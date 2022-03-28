// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  closeModal: () => void,
  membershipsBeforeDeletion: [],
  tierIndex: number,
  setCreatorMemberships: () => void,
};

export default function ModalRemoveCard(props: Props) {
  const { closeModal, setCreatorMemberships, membershipsBeforeDeletion, tierIndex } = props;

  function deleteMembership() {
    const membershipsAfterDeletion = membershipsBeforeDeletion.filter((tiers, index) => index !== tierIndex);
    setCreatorMemberships(membershipsAfterDeletion);
    closeModal();
  }

  return (
    <Modal ariaHideApp={false} isOpen contentLabel={'hello'} type="card" onAborted={closeModal}>
      <Card
        title={__('Confirm Delete Membership')}
        actions={
          <div className="section__actions">
            <Button
              className="stripe__confirm-remove-card"
              button="secondary"
              icon={ICONS.DELETE}
              label={__('Delete Membership')}
              onClick={deleteMembership}
            />
            <Button button="link" label={__('Cancel')} onClick={closeModal} />
          </div>
        }
      />
    </Modal>
  );
}
