// @flow
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import React from 'react';
import AstronautAndFriends from './astronaut_n_friends.png';

type Props = {};

export default function MembershipSplash(props: Props) {
  /** RENDER **/

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
            {logo}
            <span>{__('PREMIUM')}</span>
          </section>
          <section>{__('Get early access and features and remove ads for 99c')}</section>
        </section>
      </div>

      <div className="membership-splash__info-wrapper">
        <div className="membership-splash__info">
          {__("creating a revolutionary video platform for everyone is something we're proud to be doing.....")}
        </div>

        <div className="membership-splash__info">
          <section className="membership-splash__info-header">
            <div className="membership-splash__info-price">
              <Icon icon={ICONS.PREMIUM} />
              {__('99¢')}
            </div>
            <div className="membership-splash__info-range">{__('A MONTH')}</div>
          </section>

          {badgeInfo}

          {earlyAcessInfo}

          <div className="membership-splash__info-button">
            <Button button="primary" label={__('Apply for Membership')} />
          </div>
        </div>

        <div className="membership-splash__info">
          <section className="membership-splash__info-header">
            <div className="membership-splash__info-price">
              <Icon icon={ICONS.PREMIUM_PLUS} />
              {__('$2.99')}
            </div>
            <div className="membership-splash__info-range">{__('A MONTH')}</div>
          </section>

          {noAdsInfo}

          {badgeInfo}

          {earlyAcessInfo}
          <div className="membership-splash__info-button">
            <Button button="primary" label={__('Apply for Membership')} />
          </div>
        </div>
      </div>
    </div>
  );
}
