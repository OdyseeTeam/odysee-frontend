// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import classnames from 'classnames';
import { getChannelFromClaim } from 'util/claim';

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'Members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'Early access content',
  },
  {
    perkName: 'badge',
    perkDescription: 'Member Badge',
  },
  {
    perkName: 'emojis',
    perkDescription: 'Members-only emojis',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'MVP member badge',
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
    description: 'Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend!' ,
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
  {
    displayName: 'Community MVP2',
    description: 'Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
  {
    displayName: 'Community MVP3',
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
  myChannelClaimIds: ?Array<string>,
  claim: StreamClaim,
};

export default function PreviewPage(props: Props) {
  const {
    uri,
    selectedTier,
    tabButtonProps,
    handleConfirm,
    setMembershipIndex,
    // -- redux --
    canReceiveFiatTips,
    hasSavedCard,
    creatorHasMemberships,
    doTipAccountCheckForUri,
    doGetCustomerStatus,
    myChannelClaimIds,
    claim,
    isChannelTab
  } = props;

  // check if a user is looking at their own memberships
  const contentChannelClaim = getChannelFromClaim(claim);
  const channelClaimId = contentChannelClaim && contentChannelClaim.claim_id;
  const checkingOwnMembershipCard = myChannelClaimIds && myChannelClaimIds.includes(channelClaimId);

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

  function clickSignupButton(e){
    e.preventDefault();
    e.stopPropagation();
    const membershipTier = e.currentTarget.getAttribute('membership-tier-index');
    setMembershipIndex(membershipTier);
    handleConfirm();
  }

  function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
  }

  const showMore = function(e) {
    e.preventDefault();
    e.stopPropagation();


    const showMoreButton = e.currentTarget;
    showMoreButton.style.display = 'none';

    const parentDiv = showMoreButton.parentNode;
    parentDiv.style.height = 'auto';

    const tierDiv = parentDiv.querySelector('.tierInfo');
    tierDiv.style.height = 'unset';
    tierDiv.scrollIntoView({ behavior: 'smooth' });
  };

  const showAllTiers = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const seeAllTiersButton = e.currentTarget;

    seeAllTiersButton.style.display = 'none';

    const membershipTierDivs = document.getElementsByClassName('membership-join-blocks__body');
    for (const tierDiv of membershipTierDivs) {
      tierDiv.style.display = 'flex';
    }

    const lastTier = membershipTierDivs[membershipTierDivs.length - 1];
    lastTier.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    setTimeout(function(){
      const tiers = document.getElementsByClassName('tierInfo');
      for (const tier of tiers) {
        const elementIsOverflown = isOverflown(tier);
        const seeMoreButton = tier.parentNode.querySelector('.tier-show-more__button');
        if (elementIsOverflown) seeMoreButton.style.display = 'block';
      }

      window.balanceText();
    }, 1000);
  }, []);

  return (
    <>
      {!shouldDisablePurchase ? (
        <>
          { isChannelTab ? (<>
            <div className="membership-join-blocks__div">
              {membershipTiers.map(function(membership, i) {
                return (
                  <div className="membership-join-blocks__body" key={i}>
                    <section className="membership-join__plan-info">
                      <h1 className="membership-join__plan-header">{membership.displayName}</h1>
                      <Button
                        className="membership-join-block-purchase__button"
                        icon={ICONS.UPGRADE}
                        button="primary"
                        type="submit"
                        disabled={shouldDisablePurchase || checkingOwnMembershipCard}
                        label={__('Signup for $%membership_price% a month', {
                          membership_price: membership.monthlyContributionInUSD,
                        })}
                        onClick={(e) => clickSignupButton(e)}
                        membership-tier-index={i}
                      />
                    </section>

                    <div className="tierInfo">
                      <span className="section__subtitle membership-join__plan-description">
                        <h1 className="balance-text">
                          {membership.description}
                        </h1>
                      </span>

                      <section className="membership__plan-perks">
                        <h1 className="membership-join__plan-header">{__('Perks')}</h1>
                        <ul className="membership-join-perks__list">
                          {membership.perks.map((tierPerk, i) => (
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
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                      {/*<h1>Hello</h1>*/}
                    </div>

                    {/* overflow show rest of tier button */}
                    <div className="tier-show-more__button" style={{ display: 'none' }} onClick={(e) => showMore(e)}>
                      <h1 style={{ marginTop: '14px' }} >SHOW MORE</h1>
                    </div>
                  </div>
                );
              })}

              {/* show the rest of the tiers button */}
              <h1 style={{ margin: '0 auto' }} onClick={(e) => showAllTiers(e)}>See More</h1>
            </div>
          </>) : (
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
                  <ul className="membership-join-perks__list">
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
          )}
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
          <>
            { !isChannelTab && (
              <>
                <Button
                  className="membership-join-purchase__button"
                  icon={ICONS.UPGRADE}
                  button="primary"
                  type="submit"
                  disabled={shouldDisablePurchase || checkingOwnMembershipCard}
                  label={__('Signup for $%membership_price% a month', {
                    membership_price: selectedTier.monthlyContributionInUSD,
                  })}
                  onClick={handleConfirm}
                />
                {checkingOwnMembershipCard && (<h1 style={{ marginTop: '20px' }}>You're not able to signup for your own memberships</h1>)}

              </>
            ) }
          </>
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
