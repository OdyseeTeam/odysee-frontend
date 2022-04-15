// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import classnames from 'classnames';

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
  uri: string,
  selectedTier: any,
  tabButtonProps: any,
  handleConfirm: () => void,
  // -- redux --
  canReceiveFiatTips: ?boolean,
  hasSavedCard: ?boolean,
  creatorHasMemberships: boolean,
  doTipAccountCheckForUri: (uri: string) => void,
  doGetCustomerStatus: () => void,
};

export default function PreviewPage(props: Props) {
  const {
    uri,
    selectedTier,
    tabButtonProps,
    handleConfirm,
    // -- redux --
    canReceiveFiatTips,
    hasSavedCard,
    creatorHasMemberships,
    doTipAccountCheckForUri,
    doGetCustomerStatus,
  } = props;

  // if a membership can't be purchased from the creator
  const shouldDisablePurchase = !creatorHasMemberships || canReceiveFiatTips === false || hasSavedCard === false;

  React.useEffect(() => {
    if (hasSavedCard === undefined) {
      doGetCustomerStatus();
    }
  }, [doGetCustomerStatus, hasSavedCard]);

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  return (
    <>
      {!shouldDisablePurchase ? (
        <>
          <div className="membership-join__tab-buttons">
            {membershipTiers.map((membershipTier, index) => {
              const tierStr = __('Tier %tier_number%', { tier_number: index + 1 });
              return <TabSwitchButton key={tierStr} index={index} label={tierStr} {...tabButtonProps} />;
            })}
          </div>

          <div className="membership-join__body">
            <section className="membership-join__plan-info">
              <h1 className="membership-join__plan-header">{selectedTier.displayName}</h1>
              <span className="section__subtitle membership-join__plan-description">{selectedTier.description}</span>
            </section>

            <section className="membership__plan-perks">
              <h1 className="membership-join__plan-header">{__('Perks')}</h1>
              <ul>
                {selectedTier.perks.map((tierPerk, i) => (
                  <p key={tierPerk}>
                    {perkDescriptions.map(
                      (globalPerk, i) =>
                        tierPerk === globalPerk.perkName && (
                          <li className="section__subtitle membership-join__perk-item">{globalPerk.perkDescription}</li>
                        )
                    )}
                  </p>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : hasSavedCard === false ? (
        <div className="help help__no-card">
          <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
          {' ' + __('To Become a Channel Member')}
        </div>
      ) : (
        <div className="can-create-your-own-memberships__div">
          {__(
          "Unfortunately, this creator hasn't activated their membership functionality yet, but you can create your own tiers and have your own memberships by following this link"
          )}
        </div>
      )}

      <div className="membership-join-purchase__div">
        {shouldDisablePurchase ? (
          <Button
            className="membership-join-purchase__button"
            icon={ICONS.UPGRADE}
            button="primary"
            type="submit"
            label={__('Create Your Memberships')}
            navigate="$/memberships"
          />
        ) : (
          <Button
            className="membership-join-purchase__button"
            icon={ICONS.UPGRADE}
            button="primary"
            type="submit"
            disabled={shouldDisablePurchase}
            label={__('Signup for $%membership_price% a month', {
              membership_price: selectedTier.monthlyContributionInUSD,
            })}
            onClick={handleConfirm}
          />
        )}
      </div>
    </>
  );
}

type TabButtonProps = {
  label: string,
  activeTab: string,
  setActiveTab: (string) => void,
  index: number,
  setMembershipIndex: (number) => void,
};

const TabSwitchButton = (tabButtonProps: TabButtonProps) => {
  const { label, activeTab, setActiveTab, index, setMembershipIndex } = tabButtonProps;

  return (
    <Button
      label={label}
      button="alt"
      onClick={() => {
        const tipInputElement = document.getElementById('tip-input');
        if (tipInputElement) tipInputElement.focus();
        setActiveTab(label);
        setMembershipIndex(index);
      }}
      className={classnames('button-toggle', { 'button-toggle--active': activeTab === label })}
    />
  );
};
