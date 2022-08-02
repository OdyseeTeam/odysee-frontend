// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type Props = {
  closeModal: () => void,
  membershipsBeforeDeletion: [],
  tierIndex: number,
  setCreatorMemberships: () => void,
};

async function deactivateMembership(membershipId) {
  // show the memberships the user is subscribed to
  const response = await Lbryio.call(
    'membership',
    'deactivate',
    {
      environment: stripeEnvironment,
      membership_id: membershipId,
    },
    'post'
  );

  return response;
}

export default function ModalRemoveCard(props: Props) {
  const { closeModal, setCreatorMemberships, membershipsBeforeDeletion, tierIndex, getExistingTiers } = props;

  async function deleteMembership() {
    const selectedMembershipId = membershipsBeforeDeletion[tierIndex].Membership.id;

    try {
      const response = await deactivateMembership(selectedMembershipId);
      console.log(response);
      const membershipsAfterDeletion = membershipsBeforeDeletion.filter((tiers, index) => index !== tierIndex);
      setCreatorMemberships(membershipsAfterDeletion);
      closeModal();
      getExistingTiers();
    } catch (err) {
      closeModal();
    }
  }

  return (
    <Modal ariaHideApp={false} isOpen type="card" onAborted={closeModal}>
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
