// @flow

import moment from 'moment';

export const getTotalPriceFromSupportersList = (supportersList: SupportersList) =>
  supportersList.map((supporter) => supporter.price).reduce((total, supporterPledge) => total + supporterPledge, 0);

export const getLastMonthPayments = (payments: any) => {
  const monthago = moment().subtract(30, 'days');
  return payments
    .filter((p) => p.completed_at && moment(p.completed_at).diff(monthago) > 0)
    .reduce((total, payment) => {
      return total + payment.usd_amount;
    }, 0);
};

/**
 * Given the current form type combination, what is the applicable perk name
 * that provides members-only restriction.
 *
 * @param type
 * @param liveCreateType
 * @param liveEditType
 * @returns {string}
 */
export function getRestrictivePerkName(type: PublishType, liveCreateType: LiveCreateType, liveEditType: LiveEditType) {
  const EXCLUSIVE_CONTENT = 'Exclusive content';
  const EXCLUSIVE_LIVESTREAMS = 'Exclusive livestreams';

  switch (type) {
    case 'file':
    case 'post':
      return EXCLUSIVE_CONTENT;
    case 'livestream':
      // -- liveCreateType --
      switch (liveCreateType) {
        case 'new_placeholder':
          return EXCLUSIVE_LIVESTREAMS;
        case 'choose_replay':
          return EXCLUSIVE_CONTENT;
        case 'edit_placeholder':
          // -- liveEditType --
          switch (liveEditType) {
            case 'update_only':
              return EXCLUSIVE_LIVESTREAMS;
            case 'use_replay':
            case 'upload_replay':
              return EXCLUSIVE_CONTENT;
          }
      }
  }

  assert(false, 'unhandled restriction combo', { type, liveCreateType, liveEditType });
  return EXCLUSIVE_CONTENT;
}

export function filterMembershipTiersWithPerk(membershipTiers: Array<CreatorMembership>, perkName: string) {
  const filtered: Array<CreatorMembership> = membershipTiers.filter((t: CreatorMembership) => {
    return t.perks && t.perks.some((perk: MembershipOdyseePerk) => perk.name === perkName);
  });
  return filtered;
}

export function membershipIsExpired(ends_at: any) {
  const now = new Date();
  const endsAt = new Date(ends_at);
  return now > endsAt;
}

export const getRenewByMoment = (membershipSub) => {
  const fpda = membershipSub.membership.first_payment_due_at;
  const fpdaMoment = moment(fpda);
  const endsAtMoment = moment(membershipSub.subscription.ends_at);
  const nowMoment = moment();
  const fpdaInFuture = nowMoment.diff(fpdaMoment) < 0;
  const endsAtInPast = endsAtMoment && nowMoment.diff(endsAtMoment) > 0;
  const hasPendingPayment = membershipSub.payments.some((m) => m.status === 'submitted');
  if (hasPendingPayment) {
    return null;
  }
  if (fpda === null && endsAtInPast) {
    return null;
  }
  if (fpdaInFuture && endsAtInPast) {
    return fpdaMoment;
  }
  return endsAtMoment;
};

export const getFormattedRenewBy = (membershipSub) => {
  const renewByMoment = getRenewByMoment(membershipSub);
  if (renewByMoment === null) {
    return null;
  }

  return renewByMoment.format('LL');
};
