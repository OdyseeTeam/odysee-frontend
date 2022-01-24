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
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const { closeModal, membershipId, subscriptionPeriod, userChannelName, userChannelClaimId } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState();

  async function purchaseMembership() {
    try {
      setWaitingForBackend(true);

      // show the memberships the user is subscribed to
      const response = await Lbryio.call('membership', 'buy', {
        environment: stripeEnvironment,
        membership_id: membershipId,
        yearly: subscriptionPeriod,
        channel_id: userChannelClaimId,
        channel_name: userChannelName,
      }, 'post');

      console.log('purchase, purchase membership response');
      console.log(response);

      // $FlowFixMe
      // location.reload();

      closeModal();
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Modal ariaHideApp={false} isOpen contentLabel={'hello'} type="card" onAborted={closeModal}>
      <Card
        title={__('Confirm Membership Purchase')}
        actions={
          <div className="section__actions">
            { !waitingForBackend && (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="secondary"
                  icon={ICONS.FINANCE}
                  label={__('Confirm Purchase')}
                  onClick={purchaseMembership}
                />
                <Button button="link" label={__('Cancel')} onClick={closeModal} />
              </>
            )}
            { waitingForBackend && (
              <>
                <h1 style={{fontSize: '18px'}}>Facilitating your puchase...</h1>
              </>
            )}
          </div>
        }
      />
    </Modal>
  );
}
