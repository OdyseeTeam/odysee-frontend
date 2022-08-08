// @flow
import React, { useEffect } from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import classnames from 'classnames';
import { getChannelFromClaim } from 'util/claim';
import BalanceText from 'react-balance-text';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

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
  channelIsMine: boolean,
};

export default function PreviewPage(props: Props) {
  const {
    uri,
    // selectedTier,
    tabButtonProps,
    handleConfirm,
    setMembershipIndex,
    isChannelTab,
    expandedTabs,
    setExpandedTabs,
    setSeeAllTiers,
    seeAllTiers,
    setCreatorMemberships,
    creatorMemberships,
    // -- redux --
    canReceiveFiatTips,
    hasSavedCard,
    creatorHasMemberships,
    doTipAccountCheckForUri,
    doGetCustomerStatus,
    myChannelClaimIds,
    claim,
    channelIsMine,
    channelName,
    channelId,
  } = props;

  // check if a user is looking at their own memberships
  const contentChannelClaim = getChannelFromClaim(claim);
  const channelClaimId = contentChannelClaim && contentChannelClaim.claim_id;

  const checkingOwnMembershipCard = myChannelClaimIds && myChannelClaimIds.includes(channelId);

  // if a membership can't be purchased from the creator
  const shouldDisablePurchase = !creatorHasMemberships || canReceiveFiatTips === false || hasSavedCard === false;

  const creatorHasNoMemberships = !creatorHasMemberships || canReceiveFiatTips === false;

  async function getExistingTiers() {
    const response = await Lbryio.call(
      'membership',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: channelName,
        channel_id: channelId,
      },
      'post'
    );

    console.log(response);

    if (response === null) {
      setCreatorMemberships([]);
    } else {
      setCreatorMemberships(response);
    }

    return response;
  }

  const selectedTier = creatorMemberships && creatorMemberships[0]

  console.log(creatorMemberships);
  console.log('selected tier');
  console.log(selectedTier);

  useEffect(() => {
    if (channelName && channelId) {
      getExistingTiers();
    }
  }, [channelName, channelId]);

  useEffect(() => {
    if (hasSavedCard === undefined) {
      doGetCustomerStatus();
    }
  }, [doGetCustomerStatus, hasSavedCard]);

  useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  function clickSignupButton(e) {
    e.preventDefault();
    e.stopPropagation();
    const membershipTier = e.currentTarget.getAttribute('membership-tier-index');
    expandedTabs[membershipTier] = true;
    setExpandedTabs(expandedTabs);
    setMembershipIndex(membershipTier);

    handleConfirm();
  }

  function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
  }

  const showMore = function(e) {
    e.preventDefault();
    e.stopPropagation();

    const membershipTier = e.currentTarget.getAttribute('membership-tier-index');
    expandedTabs[membershipTier] = true;
    setExpandedTabs(expandedTabs);
    setMembershipIndex(membershipTier);

    const showMoreButton = e.currentTarget;
    const parentNode = showMoreButton.parentNode;

    setTimeout(function() {
      parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  };

  const showAllTiers = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setSeeAllTiers(true);

    setTimeout(() => {
      const membershipTierDivs = document.getElementsByClassName('membership-join-blocks__body');
      const lastTier = membershipTierDivs[membershipTierDivs.length - 1];
      lastTier.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  React.useEffect(() => {
    setTimeout(() => {
      const tiers = document.getElementsByClassName('tierInfo');
      for (const tier of tiers) {
        const elementIsOverflown = isOverflown(tier);
        const seeMoreButton = tier.parentNode.querySelector('.tier-show-more__button');
        if (elementIsOverflown && seeMoreButton) seeMoreButton.style.display = 'block';
      }
    }, 0);
  }, []);

  let hasntCreatedChannelsText;
  if (channelIsMine) {
    hasntCreatedChannelsText = 'Unfortunately you haven\'t activated your memberships functionality yet, but you can do so now at the link below';
  } else {
    hasntCreatedChannelsText = 'Unfortunately, this creator hasn\'t activated their membership functionality yet, but you can create your own memberships with the link below';
  }

  let subtitleText;
  if (!checkingOwnMembershipCard){
    subtitleText = 'Join this creator\'s channel for access to exclusive content and perks';
  } else if (creatorMemberships && creatorMemberships.length){
    subtitleText = 'Your memberships are active but you cannot join your own memberships';
  } else {
    subtitleText = 'You haven\'t setup your own memberships yet but you can start now!';
  }

  const showMoreButtons = document.getElementsByClassName('tier-show-more__button');
  for (const showMoreButton of showMoreButtons) {
    const infoHeight = showMoreButton.previousSibling.clientHeight;
    if (infoHeight === 132){
      showMoreButton.style.display = 'inline';
    }
  }

  return (
    <>
      <h1 className="join-membership__header">Join Membership</h1>
      <h3 className="join-membership__subtitle">{subtitleText}</h3>

      {/* show the creator's memberships */}
      {creatorHasMemberships && (
        <>
          { hasSavedCard === false && (
            <div className="help help__no-card" style={{ fontSize: '18px' }}>
              <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
              {' ' + __('To Become a Channel Member')}
            </div>
          )}
          {/** channel tab preview section (blocks) **/}
          { isChannelTab && (
            <>
              <div className="membership-join-blocks__div">
                {creatorMemberships && creatorMemberships.map(function(membership, i) {
                  <>{console.log(membership)}</>
                  return (
                    <div className={classnames('membership-join-blocks__body', {
                      'expandedBlock': expandedTabs[i],
                      'forceShowTiers': seeAllTiers,
                    })} key={i}>
                      <section className="membership-join__plan-info">
                        <h1 className="membership-join__plan-header">{membership.Membership.name}</h1>
                        <Button
                          className="membership-join-block-purchase__button"
                          icon={ICONS.UPGRADE}
                          button="primary"
                          type="submit"
                          disabled={shouldDisablePurchase || checkingOwnMembershipCard}
                          label={__('Signup for $%membership_price% a month', {
                            membership_price: membership.NewPrices[0].Price.amount / 100,
                          })}
                          onClick={(e) => clickSignupButton(e)}
                          membership-tier-index={i}
                        />
                      </section>

                      <div className={classnames('tierInfo', { 'expandedBlock': expandedTabs[i] })}>
                        {/* membership description */}
                        <span className="section__subtitle membership-join__plan-description">
                        <h1 style={{ lineHeight: '27px' }}>
                          <BalanceText>{membership.Membership.description}</BalanceText>
                        </h1>
                      </span>

                        { membership.Perks && membership.Perks.length > 0 && (
                          <section className="membership__plan-perks">
                            <h1 className="membership-join__plan-header" style={{ marginTop: '17px' }}>{__('Perks')}</h1>
                            <ul className="membership-join-perks__list">
                              {membership.Perks.map((tierPerk, i) => (
                                <p key={tierPerk}>
                                  <li className="section__subtitle membership-join__perk-item">{tierPerk.name}</li>
                                </p>
                              ))}
                            </ul>
                          </section>
                        )}
                      </div>

                      {/* overflow show rest of tier button */}
                      { !expandedTabs[i] && (
                        <div
                          className="tier-show-more__button"
                          membership-tier-index={i}
                          onClick={(e) => showMore(e)}
                          style={{ display: 'none' }}
                        >
                          <h1 style={{ marginTop: '14px' }} >SHOW MORE</h1>
                        </div>
                      )}
                    </div>
                  );
                })}
                { !seeAllTiers && creatorMemberships && creatorMemberships.length > 3 && (
                  <>
                    {/* show the rest of the tiers button */}
                    <h1 className="see-all-tiers__header" onClick={(e) => showAllTiers(e)}>See More</h1>
                  </>
                )}
              </div>
            </>
          )}



          {!isChannelTab && creatorMemberships && selectedTier && (
            // modal preview section
            <>
              <>{console.log('RUNNING HERE')}</>
              <div className="membership-join__tab-buttons">
                {creatorMemberships.map((creatorMembership, index) => {
                  const tierStr = __('Tier %tier_number%', { tier_number: index + 1 });
                  return <TabSwitchButton key={tierStr} index={index} label={tierStr} {...tabButtonProps} />;
                })}
              </div>

              <div className="membership-join__body">
                <section className="membership-join__plan-info">
                  <h1 className="membership-join__plan-header">{selectedTier.name}</h1>
                  <span className="section__subtitle membership-join__plan-description">
                    <h1 style={{ lineHeight: '27px' }}>
                      <BalanceText>{selectedTier.description}</BalanceText>
                    </h1>
                  </span>
                </section>

                <section className="membership__plan-perks">
                  <h1 className="membership-join__plan-header" style={{ marginBottom: '5px' }}>{__('Perks')}</h1>
                  <ul className="membership-join-perks__list">
                    {selectedTier.Perks.map((tierPerk, i) => (
                      <p key={tierPerk}>
                        <li className="section__subtitle membership-join__perk-item">{tierPerk.description}</li>
                      </p>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </>
      )}

      {/*{ !hasSavedCard && (*/}
      {/*  <div className="can-create-your-own-memberships__div" style={{ marginTop: '36px' }}>*/}
      {/*    <BalanceText>*/}
      {/*      {__(hasntCreatedChannelsText)}*/}
      {/*    </BalanceText>*/}
      {/*  </div>*/}
      {/*)}*/}

      <div className="membership-join-purchase__div">
        {!creatorHasMemberships && (
          <>
            <div className="can-create-your-own-memberships__div" style={{ marginTop: '36px' }}>
              <BalanceText>
                {__(hasntCreatedChannelsText)}
              </BalanceText>
              <Button
                className="membership-join-purchase__button"
                icon={ICONS.UPGRADE}
                button="primary"
                type="submit"
                label={__('Create Your Memberships')}
                navigate="$/memberships"
                style={{ marginTop: '15px' }}
              />
            </div>
          </>
        )}

        { shouldDisablePurchase && !isChannelTab && (
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
