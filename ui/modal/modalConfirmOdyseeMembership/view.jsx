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
  const {
    closeModal,
    membershipId,
    populateMembershipData,
    odyseeChannelId,
    odyseeChannelName,
    hasMembership,
    priceId,
    purchaseString,
    plan,
    setMembershipOptions,
  } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState();
  const [statusText, setStatusText] = React.useState();

  async function purchaseMembership() {
    try {
      setWaitingForBackend(true);
      setStatusText('Facilitating your purchase...');

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

      var newURL = location.href.split('?')[0];
      window.history.pushState('object', document.title, newURL);

      setStatusText('Membership purchase was successful');

      await populateMembershipData();
      // clear the other membership options after making a purchase
      setMembershipOptions(false);

      closeModal();

      // setTimeout(function(){
      //   // $FlowFixMe
      //   // location.reload();
      //   closeModal();
      // }, 950)
    } catch (err) {
      console.log(err);
    }
  }

  // Cancel
  async function cancelMembership() {
    try {
      setWaitingForBackend(true);
      setStatusText('Canceling your membership...');

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

      setStatusText('Membership successfully canceled');

      await populateMembershipData();

      closeModal();

      // setTimeout(function () {
      //   // $FlowFixMe
      //   // location.reload();
      // }, 950);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Modal ariaHideApp={false} isOpen contentLabel={'hello'} type="card" onAborted={closeModal}>
      <Card
        className="stripe__confirm-remove-membership"
        title={hasMembership ? __('Confirm Membership Cancellation') : __(`Confirm ${plan} Membership`)}
        subtitle={purchaseString}
        actions={
          <div className="section__actions">
            {!waitingForBackend && (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="secondary"
                  icon={ICONS.FINANCE}
                  label={hasMembership ? __('Confirm Cancellation') : __('Confirm Purchase')}
                  onClick={() => (hasMembership ? cancelMembership() : purchaseMembership())}
                  // onClick={hasMembership ? cancelMembership : purchaseMembership}
                />
                <Button button="link" label={__('Cancel')} onClick={closeModal} />
              </>
            )}
            {waitingForBackend && (
              <>
                <h1 style={{ fontSize: '18px' }}>{statusText}</h1>
              </>
            )}
          </div>
        }
      />
    </Modal>
  );
}
