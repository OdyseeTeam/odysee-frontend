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
};

const MembershipTier = (props: Props) => {
  const {
    membership,
    index,
    length,
    disabled,
    isChannelTab,
    handleSelect,
    isActive,
    isPending,
    isCanceled,
    userHasCreatorMembership,
    doOpenCancelationModalForMembership,
    thisMembership,
  } = props;

  const getMembershipAction = () => {
    if (isActive) {
      return (<div className={'help'}>Currently Subscribed!</div>);
    }

    if (isPending) {
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
          membership?.prices[0].amount < 100 ? 2 : 0,
        ),
      })}
      </div>);
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
