// @flow
import React from 'react';

import { formatDateToMonthDayAndYear } from 'util/time';

import * as MEMBERSHIP_CONSTS from 'constants/memberships';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';

import Button from 'component/button';
import MembershipBadge from 'component/membershipBadge';

type Props = {
  key: any,
  membership: CreatorMembership | MembershipTier,
  isCancelled: boolean,
  // -- redux --
  preferredCurrency: CurrencyOption,
  doOpenModal: (modalId: string, {}) => void,
  doOpenCancelationModalForMembership: (membership: MembershipTier) => void,
};

const PremiumOption = (props: Props) => {
  const {
    key,
    membership: passedMembership,
    isCancelled,
    preferredCurrency,
    doOpenModal,
    doOpenCancelationModalForMembership,
  } = props;

  // $FlowFixMe
  if (passedMembership.Prices) {
    // $FlowFixMe
    const membership: CreatorMembership = passedMembership;
    const { Membership, Prices } = membership;

    return (
      <div className="premium-option" key={key}>
        <h4 className="membership_title">
          {Membership.name}
          <MembershipBadge membershipName={Membership.name} />
        </h4>

        <h4 className="membership_subtitle">{__(MEMBERSHIP_CONSTS.DESCRIPTIONS[Membership.name])}</h4>

        {Prices.map(
          (price) =>
            !(price.recurring.interval === 'month' && Membership.name === 'Premium') &&
            price.currency.toUpperCase() === preferredCurrency && (
              <>
                <h4 className="membership_info">
                  <b>{__('Interval')}:</b> {MEMBERSHIP_CONSTS.INTERVALS[price.recurring.interval]}
                </h4>

                <h4 className="membership_info">
                  <b>{__('Price')}:</b>{' '}
                  {price.currency.toUpperCase() + ' ' + STRIPE.CURRENCY[price.currency.toUpperCase()].symbol}
                  {price.unit_amount / 100} / {MEMBERSHIP_CONSTS.INTERVALS[price.recurring.interval]}
                </h4>

                <Button
                  button="primary"
                  onClick={() => doOpenModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, { membership, price })}
                  membership-id={Membership.id}
                  membership-subscription-period={Membership.type}
                  price-id={price.id}
                  className="membership_button"
                  label={__('Join via %interval% membership', {
                    interval: price.recurring.interval,
                  })}
                  icon={ICONS.FINANCE}
                  interval={price.recurring.interval}
                  plan={Membership.name}
                />
              </>
            )
        )}
      </div>
    );
  }

  // $FlowFixMe
  const membership: MembershipTier = passedMembership;
  const { Membership, MembershipDetails, Subscription } = membership;

  return (
    <div className="premium-option" key={MembershipDetails.name}>
      <h4 className="membership_title">
        {MembershipDetails.name}
        <MembershipBadge membershipName={MembershipDetails.name} />
      </h4>

      <h4 className="membership_subtitle">{__(MEMBERSHIP_CONSTS.DESCRIPTIONS[MembershipDetails.name])}</h4>

      <h4 className="membership_info">
        <b>{__('Registered On')}:</b> {formatDateToMonthDayAndYear(Membership.created_at)}
      </h4>

      <h4 className="membership_info">
        <b>{__(isCancelled ? 'Canceled On' : 'Auto-Renews On')}:</b>{' '}
        {formatDateToMonthDayAndYear((isCancelled ? Subscription.canceled_at : Subscription.current_period_end) * 1000)}
      </h4>

      {!isCancelled && (
        <h4 className="membership_info">
          <b>{__('Still Valid Until')}:</b> {formatDateToMonthDayAndYear(Subscription.current_period_end * 1000)}
        </h4>
      )}

      {!isCancelled && Subscription.canceled_at === 0 && (
        <Button
          button="alt"
          membership-id={Membership.membership_id}
          onClick={() => doOpenCancelationModalForMembership(membership)}
          className="cancel-membership-button"
          label={__('Cancel membership')}
          icon={ICONS.FINANCE}
        />
      )}
    </div>
  );
};

export default PremiumOption;
