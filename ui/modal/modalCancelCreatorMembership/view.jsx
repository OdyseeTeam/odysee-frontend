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
  endOfMembershipDate: string,
  // doToast:
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const {
    closeModal,
    endOfMembershipDate,
    membershipId,
    doToast,
    doMembershipMine,
  } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState();
  const [statusText, setStatusText] = React.useState();

  async function cancelMembership() {
    setWaitingForBackend(true);
    setStatusText(__('Cancelling your membership...'));

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

    setStatusText(__('Membership successfully cancelled'));

    doMembershipMine();
    setTimeout(function() {
      closeModal();

      doToast({ message: __('Your membership was cancelled and will no longer be renewed') });
    }, 700);
  }

  const cancellationString = 'Are you sure you want to cancel your membership? ' +
    `You will still have all your features until ${endOfMembershipDate} at which point your purchase will not renewed ` +
    'and you will lose access to your membership features and perks';

  return (
    <Modal className="cancel-creator-membership__modal" ariaHideApp={false} isOpen contentLabel={'Confirm Membership Purchase'} type="card" onAborted={closeModal}>
      <Card
        title={__('Confirm Cancel Membership')}
        subtitle={cancellationString}
        actions={
          <div className="section__actions">
            {!waitingForBackend ? (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="primary"
                  icon={ICONS.DELETE}
                  label={__('Cancel Membership')}
                  onClick={cancelMembership}
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
