// @flow
import * as ICONS from 'constants/icons';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import Icon from 'component/common/icon';
import Button from 'component/button';
import React from 'react';
import * as MODALS from 'constants/modal_types';
import AstronautAndFriends from './astronaut_n_friends.png';
import BadgePremium from './badge_premium.png';
import BadgePremiumPlus from './badge_premium-plus.png';
import OdyseePremium from './odysee_premium.png';
let stripeEnvironment = getStripeEnvironment();

type Props = {};

export default function MembershipSplash(props: Props) {
  // const { } = props;

  const [membershipOptions, setMembershipOptions] = React.useState();
  const { openModal, odyseeMembership, pageLocation } = props;

  const logo = <Icon className="header__logo" icon={ICONS.ODYSEE_WHITE_TEXT} />;

  const earlyAcessInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.EARLY_ACCESS} />
      {__('Early access to features')}
    </div>
  );
  const badgeInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.MEMBER_BADGE} />
      {__('Badge on profile')}
    </div>
  );
  const noAdsInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.NO_ADS} />
      {__('No ads')}
    </div>
  );

  return (
    <div className="membership-splash">
      <div className="membership-splash__banner">
        <img src={AstronautAndFriends} />
        <section className="membership-splash__title">
          <section>
            <img src={OdyseePremium} />
          </section>
          <section>
            {__('Get ')}
            <b>{__('early access')}</b>
            {__(' features and remove ads for ')}
            <b>{__('99¢')}</b>
          </section>
        </section>
      </div>

      <div className="membership-splash__info-wrapper">
        <div className="membership-splash__info">
          {__(
            "Creating a revolutionary video platform for everyone is something we're proud to be doing, but it isn't something that can happen without support. If you believe in Odysee's mission, please consider becoming a Premium member. As a Premium member, you'll be helping us build the best platform in the universe and we'll give you some cool perks."
          )}
        </div>

        <div className="membership-splash__info">
          <section className="membership-splash__info-header">
            <div className="membership-splash__info-price">
              <img src={BadgePremium} />

              <section>
                {__('99¢')}
                <div className="membership-splash__info-range">{__('A MONTH')}</div>
              </section>
            </div>
          </section>

          {badgeInfo}

          {earlyAcessInfo}

          <div className="membership-splash__info-button">
            <Button
              button="primary"
              label={__('Apply for Membership')}
              navigate={`/$/membership?interval=year&plan=Premium&pageLocation=${pageLocation}`}
            />
          </div>
        </div>

        <div className="membership-splash__info">
          <section className="membership-splash__info-header">
            <div className="membership-splash__info-price">
              <img src={BadgePremiumPlus} />
              <section>
                {__('$2.99')}
                <div className="membership-splash__info-range">{__('A MONTH')}</div>
              </section>
            </div>
          </section>

          {noAdsInfo}

          {badgeInfo}

          {earlyAcessInfo}
          <div className="membership-splash__info-button">
            <Button
              button="primary"
              label={__('Apply for Membership')}
              navigate={`/$/membership?interval=year&plan=Premium%2b&pageLocation=${pageLocation}&`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
