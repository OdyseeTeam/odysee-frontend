// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import JoinMembershipCard from 'component/joinMembershipCard';
import MembershipSub from './internal/MembershipSub';

type Props = {
  uri: string,
  myMembershipSubscriptions: Array<MembershipSub>,
  // -- redux --
  purchasedChannelMembership: MembershipSub,
  doOpenCancelationModalForMembership: (membership: MembershipSub) => void,
  navigate: (string) => void,
};

const MembershipTab = (props: Props) => {
  const {
    uri,
    // -- redux --
    myMembershipSubscriptions,
    purchasedChannelMembership,
  } = props;

  const activeMemberships = myMembershipSubscriptions &&
    myMembershipSubscriptions.length > 0 &&
    myMembershipSubscriptions.filter((ms) => ms.subscription.status === 'active');

  const cancelledMemberships = myMembershipSubscriptions &&
    myMembershipSubscriptions.length > 0 &&
    myMembershipSubscriptions.filter((ms) => ms.subscription.status === 'canceled');

  if (!purchasedChannelMembership) {
    return <JoinMembershipCard uri={uri} />;
  } else {
    delete window.pendingMembership;
  }
  console.log('active', activeMemberships)

  return (
    <>
      {activeMemberships.length > 0 && (
      <div className={'membership-tab-item__wrapper'}>
      <div className={'card__header--between membership-tab-header__wrapper'}>
        <h2 className={'card__title'}>Active Memberships</h2>
        <div className="button--view-memberships">
          <Button
            icon={ICONS.MEMBERSHIP}
            button="primary"
            type="submit"
            label={__('See all my memberships')}
            navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`}
          />
        </div>
      </div>
      {activeMemberships.map((subscription, index) => (
            <MembershipSub uri={uri} membershipSub={subscription} key={subscription.membership.name} />
          ))}
      </div>
      )}
      {cancelledMemberships.length > 0 && (
      <div className={'membership-tab-item__wrapper'}>
      <div className={'card__header--between membership-tab-header__wrapper'}>
        <h2 className={'card__title'}>Cancelled Memberships</h2>
      </div>
      {cancelledMemberships.map((subscription, index) => (
            <MembershipSub uri={uri} membershipSub={subscription} key={subscription.membership.name} />
          ))}
      </div>
        )}
      <div className={'membership-tab-item__wrapper'}>
      <div className={'card__header--between membership-tab-header__wrapper'}>
        <h2 className={'card__title'}>Available Memberships</h2>
      </div>
      </div>
      <JoinMembershipCard uri={uri} />
    </>
  );
};

export default MembershipTab;
