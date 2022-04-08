// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

type Props = {
  closeModal: () => void,
  paymentMethodId: string,
  setAsConfirmingCard: () => void, // ?
  hasMembership: boolean, // user already has purchased --> invoke Cancel then
  membershipId: string,
  doMembershipMine: () => void,
  userChannelClaimId: string,
  userChannelName: string,
  priceId: string,
  purchaseString: string,
  plan: string,
  doMembershipBuy: (any: any) => void,
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const {
    closeModal,
    membershipId,
    doMembershipMine,
    userChannelClaimId,
    userChannelName,
    hasMembership,
    priceId,
    purchaseString,
    plan,
    doMembershipBuy,
  } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState();
  const [statusText, setStatusText] = React.useState();

  // Cancel
  async function cancelMembership() {
    try {
      setWaitingForBackend(true);
      setStatusText(__('Canceling your membership...'));

      // show the memberships the user is subscribed to
      await Lbryio.call(
        'membership',
        'cancel',
        {
          environment: stripeEnvironment,
          membership_id: membershipId,
        },
        'post'
      );

      setStatusText(__('Membership successfully canceled'));

      // populate the new data and update frontend
      doMembershipMine();

      closeModal();
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    if (hasMembership) {
      cancelMembership();
    } else {
      doMembershipBuy({
        membership_id: membershipId,
        channel_id: userChannelClaimId,
        channel_name: userChannelName,
        price_id: priceId,
      });
    }
  }

  return (
    <Modal ariaHideApp={false} isOpen contentLabel={'Confirm Membership Purchase'} type="card" onAborted={closeModal}>
      <Card
        className="stripe__confirm-remove-membership"
        title={hasMembership ? __('Confirm Membership Cancellation') : __('Confirm %plan% Membership', { plan })}
        subtitle={purchaseString}
        actions={
          <div className="section__actions">
            {!waitingForBackend ? (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="primary"
                  icon={ICONS.FINANCE}
                  label={hasMembership ? __('Confirm Cancellation') : __('Confirm Purchase')}
                  onClick={handleClick}
                />
                <Button button="link" label={__('Cancel')} onClick={closeModal} />
              </>
            ) : (
              <h1 style={{ fontSize: '18px' }}>{statusText}</h1>
            )}
          </div>
        }
      />
    </Modal>
  );
}
