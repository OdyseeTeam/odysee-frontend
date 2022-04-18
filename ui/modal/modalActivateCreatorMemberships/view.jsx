// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  closeModal: () => void,
  haveConfirmedBankAccount: boolean,
};

export default function ModalRemoveCard(props: Props) {
  const { closeModal, haveConfirmedBankAccount } = props;

  function deleteMembership() {
    const membershipsAfterDeletion = membershipsBeforeDeletion.filter((tiers, index) => index !== tierIndex);
    setCreatorMemberships(membershipsAfterDeletion);
    closeModal();
  }

  const explainerText = 'Once you activate your memberships users will be able to subscribe to your created tiers.\n' +
    '            If a user subscribes to your tier you will not be able to delete it until their subscription has been cancelled\n' +
    '            (by them or by you), so don’t activate your memberships until you’re ready!'

  return (
    <Modal className="activate-memberships__modal" ariaHideApp={false} isOpen type="card" onAborted={closeModal}>
      <Card
        className="stripe__confirm-remove-membership"
        title={__('Activate Memberships')}
        subtitle={explainerText}
        actions={
          <div className="section__actions">
            {haveConfirmedBankAccount && <Button
              className="stripe__confirm-remove-card"
              button="secondary"
              icon={ICONS.UPGRADE}
              label={__('Activate Memberships')}
              // onClick={deleteMembership}
            />}
            <Button button="link" label={__('Cancel')} onClick={closeModal} />
          </div>
        }
      />
    </Modal>
  );
}
