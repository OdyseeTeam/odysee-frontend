// @flow
import React from 'react';

import { formatDateToMonthDayAndYear } from 'util/time';

import * as MEMBERSHIP_CONSTS from 'constants/memberships';
import * as ICONS from 'constants/icons';

import Button from 'component/button';
import MembershipBadge from 'component/membershipBadge';

type Props = {
  membershipView?: MembershipSub,
  // -- redux --
  doOpenCancelationModalForMembership: (membership: MembershipSub) => void,
};

const PremiumOption = (props: Props) => {
  const { membershipView, doOpenCancelationModalForMembership } = props;

  //   if (membershipPurchase) {
  //     const membership = membershipPurchase;
  //     const { membership_id, name, prices } = membership;
  //
  //     const purchaseFieldsProps = { preferredCurrency, membership, doOpenModal };
  //
  //     return (
  //       <Wrapper name={name}>
  //         {prices.map(({ Price, StripePrice }: MembershipNewStripePriceDetails) => (
  //           <PurchaseFields key={membership_id} {...purchaseFieldsProps} stripePrice={prices} />
  //         ))}
  //       </Wrapper>
  //     );
  //   }
  // TODO IF HAD PREMIUM THEN SHOW A NICE MESSAGE
  // TODO use new had premium endpoint
  if (membershipView) {
    const membership = membershipView;
    // $FlowIgnore - code here isn't currently used, so not trying to figure this out now
    const { Membership, MembershipDetails, Subscription } = membership; // find this

    const isCancelled = Subscription.status === 'canceled';
    const membershipStillValid = isCancelled && Subscription.current_period_end * 1000 > Date.now();

    return (
      <Wrapper name={MembershipDetails.name}>
        <h4 className="membership_info">
          <b>{__('Registered On')}:</b> {formatDateToMonthDayAndYear(Membership.created_at)}
        </h4>

        <h4 className="membership_info">
          <b>{__(isCancelled ? 'Canceled On' : 'Auto-Renews On')}:</b>{' '}
          {formatDateToMonthDayAndYear(
            (isCancelled ? Subscription.canceled_at : Subscription.current_period_end) * 1000
          )}
        </h4>

        <h4 className="membership_info">
          <b>{__(membershipStillValid ? 'Still Valid Until' : 'Ended on')}:</b>{' '}
          {formatDateToMonthDayAndYear(Subscription.current_period_end * 1000)}
        </h4>

        {(!isCancelled ? Subscription.canceled_at === 0 : !membershipStillValid) && (
          <Button
            button="alt"
            membership-id={Membership.membership_id}
            onClick={() => doOpenCancelationModalForMembership(membership)}
            className="cancel-membership-button"
            label={__('Cancel membership')}
            icon={ICONS.FINANCE}
          />
        )}
      </Wrapper>
    );
  }

  return null;
};

type WrapperProps = {
  name: string,
  children: any,
};

const Wrapper = (props: WrapperProps) => {
  const { name, children } = props;

  return (
    <div className="premium-option" key={name}>
      <h4 className="membership_title">
        {name}
        <MembershipBadge membershipName={name} />
      </h4>

      <h4 className="membership_subtitle">{__(MEMBERSHIP_CONSTS.DESCRIPTIONS[name])}</h4>

      {children}
    </div>
  );
};

export default PremiumOption;
