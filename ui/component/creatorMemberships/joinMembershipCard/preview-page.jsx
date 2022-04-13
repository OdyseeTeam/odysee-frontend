// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import classnames from 'classnames';
import Expandable from 'component/expandable';

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'You will exclusive access to members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'You will get early access to this creators content',
  },
  {
    perkName: 'badge',
    perkDescription: 'You will get a generic badge showing you are a supporter of this creator',
  },
  {
    perkName: 'emojis',
    perkDescription: 'You will get access to custom members-only emojis offered by the creator',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'You can choose a custom badge showing you are an MVP supporter',
  },
];

let membershipTiers = [
  {
    displayName: 'Helping Hand',
    description: "You're doing your part, thank you!",
    monthlyContributionInUSD: 5,
    perks: ['exclusiveAccess', 'badge'],
  },
  {
    displayName: 'Big-Time Supporter',
    description: 'You are a true fan and are helping in a big way!',
    monthlyContributionInUSD: 10,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis'],
  },
  {
    displayName: 'Community MVP',
    description: 'Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
];

type Props = {
  isModal: boolean,
  shouldDisableSelector: boolean,
  hasSavedCard: boolean,
  membershipTier: any,
  tabButtonProps: any,
  handleJoinMembership: () => void,
};

export default function ConfirmationPage(props: Props) {
  const { isModal, shouldDisableSelector, hasSavedCard, membershipTier, handleJoinMembership, tabButtonProps } = props;

  return (
    <>
      <h1 className="membership-join__subheader">
        {__("Join this creator's channel for access to exclusive content and perks")}
      </h1>

      <div className="section membership-join__tab-buttons">
        {membershipTiers.map((membershipTier, index) => {
          const tierStr = __('Tier %tier_number%', { tier_number: index + 1 });
          return <TabSwitchButton key={tierStr} index={index} label={tierStr} name={tierStr} {...tabButtonProps} />;
        })}
      </div>

      <div className="membership-join__body">
        <h1 className="membership-join__plan-header">{membershipTier.displayName}</h1>
        <h1 className="membership-join__plan-description">{membershipTier.description}</h1>
        <div className="membership-join__plan-perks">
          <h1>{isModal ? 'Perks:' : 'Perks'}</h1>
          <ul>
            <Expandable forceExpand={tabButtonProps.activeTab !== 'Tier 1'}>
              {membershipTier.perks.map((tierPerk, i) => (
                <p key={tierPerk}>
                  {perkDescriptions.map(
                    (globalPerk, i) =>
                      tierPerk === globalPerk.perkName && (
                        <li className="membership-join__plan-perks__li">{globalPerk.perkDescription}</li>
                      )
                  )}
                </p>
              ))}
            </Expandable>
          </ul>
        </div>
      </div>

      {shouldDisableSelector && (
        <div className={'help add-a-card-help-message'}>
          {!hasSavedCard ? (
            <>
              <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
              {' ' + __('To Become a Channel Member')}
            </>
          ) : (
            __('Only creators that verify cash accounts can receive tips')
          )}
        </div>
      )}

      <Button
        className="membership-join-purchase__button"
        icon={ICONS.UPGRADE}
        button="primary"
        type="submit"
        disabled={shouldDisableSelector}
        label={__('Signup for $%membership_price% a month', {
          membership_price: membershipTier.monthlyContributionInUSD,
        })}
        onClick={handleJoinMembership}
      />
    </>
  );
}

type TabButtonProps = {
  icon: string,
  label: string,
  name: string,
  isOnConfirmationPage: boolean,
  activeTab: string,
  setActiveTab: (string) => void,
  index: number,
  setMembershipIndex: (number) => void,
};

const TabSwitchButton = (tabButtonProps: TabButtonProps) => {
  const {
    icon,
    label,
    name,
    isOnConfirmationPage,
    activeTab,
    setActiveTab,
    index,
    setMembershipIndex,
  } = tabButtonProps;

  return (
    <Button
      key={name}
      icon={icon}
      label={label}
      button="alt"
      onClick={() => {
        const tipInputElement = document.getElementById('tip-input');
        if (tipInputElement) tipInputElement.focus();
        if (!isOnConfirmationPage) {
          setActiveTab(name);
          setMembershipIndex(index);
        }
      }}
      className={classnames('button-toggle', { 'button-toggle--active': activeTab === name })}
    />
  );
};
