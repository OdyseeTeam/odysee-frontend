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
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const { closeModal, membershipId, subscriptionPeriod, odyseeChannelId, odyseeChannelName, hasMembership, priceId } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState();

  async function purchaseMembership() {
    try {
      setWaitingForBackend(true);

      // show the memberships the user is subscribed to
      const response = await Lbryio.call(
        'membership',
        'buy',
        {
          environment: stripeEnvironment,
          membership_id: membershipId,
          channel_id: odyseeChannelId,
          channel_name: odyseeChannelName,
          price_id: priceId,
        },
        'post'
      );

      console.log('purchase, purchase membership response');
      console.log(response);

      // $FlowFixMe
      location.reload();

      closeModal();
    } catch (err) {
      console.log(err);
    }
  }

  // Cancel
  async function cancelMembership() {
    try {
      // show the memberships the user is subscribed to
      const response = await Lbryio.call(
        'membership',
        'cancel',
        {
          environment: stripeEnvironment,
          membership_id: membershipId,
        },
        'post'
      );

      console.log('cancel, cancel membership response');
      console.log(response);

      // $FlowFixMe
      location.reload();
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Modal ariaHideApp={false} isOpen contentLabel={'hello'} type="card" onAborted={closeModal}>
      <Card
        title={hasMembership ? __('Confirm Membership Cancellation') : __('Confirm Membership Purchase')}
        subtitle={'You are purchasing a monthly membership, that is active from [this date] and will resubscribe monthly on [this date]. You can also close this window and choose a different subscription'}
        actions={
          <div className="section__actions">
            {!waitingForBackend && (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="secondary"
                  icon={ICONS.FINANCE}
                  label={hasMembership ? __('Confirm Cancellation') : __('Confirm Purchase')}
                  onClick={hasMembership ? cancelMembership : purchaseMembership}
                />
                <Button button="link" label={__('Cancel')} onClick={closeModal} />
              </>
            )}
            {waitingForBackend && (
              <>
                {hasMembership ? (
                  <h1 style={{ fontSize: '18px' }}>Facilitating your cancel...</h1>
                ) : (
                  <h1 style={{ fontSize: '18px' }}>Facilitating your purchase...</h1>
                )}
              </>
            )}
          </div>
        }
      />
    </Modal>
  );
}
