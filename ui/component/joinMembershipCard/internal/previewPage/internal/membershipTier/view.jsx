// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import MembershipDetails from '../membershipDetails';

type Props = {
  membership: CreatorMembership,
  disabled?: boolean,
  index?: number,
  length?: number,
  isChannelTab?: boolean,
  handleSelect: () => void,
  isActive: boolean,
  isPending: boolean,
  isCanceled: boolean,
  isOwnChannel: boolean,
  userHasCreatorMembership: boolean, // here
  doOpenCancelationModalForMembership: (string, ?boolean) => void,
  thisMembership: Membership[],
  exchangeRate: { ar: number },
};

const MembershipTier = (props: Props) => {
  const {
    membership,
    index,
    length,
    disabled,
    isChannelTab,
    isOwnChannel,
    handleSelect,
    isActive,
    isPending,
    isCanceled,
    userHasCreatorMembership,
    doOpenCancelationModalForMembership,
    thisMembership,
    exchangeRate,
  } = props;

  // TODO: develop getMembershipStatus(membershipSub) util function:
  /*
  using membership.status, payments[len-1].status, renewal date, current date
  States:
    No membership
    Membership intent pending, payments[]
    Membership pending, payments[0] status submitted
    Membership active, payments[0] status paid
    Membership earliest renewal date reached
    Membership active, payments[1] status submitted
    Membership active, payments[1] status paid
    Membership lapsed
    Membership payment intent sent - pending?
    Membership lapsed, payments[2] status submitted
    Membership active, payments[2] status paid
   */

  function getHasPayment(membership) {
    if (!membership) {
      return false;
    }
    const payments = membership.payments;
    const numPayments = payments.length;

    if (!numPayments) {
      return false;
    }
    const lastPayment = payments[numPayments - 1];

    if (lastPayment.status === 'pending') {
      return false;
    }

    if (lastPayment.status === 'submitted' || lastPayment.status === 'paid') {
      return true;
    }
    console.log('unknown payment state; returning false');
    return false;
  }
  const hasPayment = getHasPayment(thisMembership);

  const getMembershipAction = () => {
    if (isActive && !isCanceled) {
      return (<div className={'help'}>Currently Subscribed!</div>);
    }

    if (isPending && hasPayment) {
      return (
        <div className={'help'}>Currently Subscribed! (Pending Confirmation)</div>
      );
    }

    if (isCanceled && userHasCreatorMembership) {
      return (<div className={'help'}>Canceled Membership.</div>);
    }
    if (isCanceled && thisMembership) {
      // return restore button
      return (
        <Button
          icon={ICONS.MEMBERSHIP}
          button="primary"
          label={__('Uncancel')}
          onClick={() => doOpenCancelationModalForMembership(thisMembership, true)}
          disabled={disabled}
        />
      );
    }

    if (userHasCreatorMembership) {
      return (<div className={'help'}>{__('$%membership_price% per month', {
        membership_price: (membership?.prices[0].amount / 100).toFixed(
          membership?.prices[0].amount < 100 ? 2 : 0
        ),
      })}
      </div>);
    }

    if (isOwnChannel) {
      return null;
    }

    // return Join button
    return (
      <Button
        icon={ICONS.MEMBERSHIP}
        button="primary"
        label={__('Join C for $%membership_price% per month', {
          membership_price: (membership?.prices[0].amount / 100).toFixed(
            membership?.prices[0].amount < 100 ? 2 : 0
          ), // tiers
        })}
        onClick={handleSelect}
        disabled={disabled}
      />
    );
  };

  return (
    <div
      className={
        Number.isInteger(index) && Number.isInteger(length)
          ? `membership-tier__wrapper item${(index || 0) + 1}-${length || 0}`
          : 'membership-tier__wrapper'
      }
    >
      <MembershipDetails
        isChannelTab={isChannelTab}
        membership={membership}
        headerAction={
          getMembershipAction()
        }
      />
    </div>
  );
};

export default MembershipTier;
