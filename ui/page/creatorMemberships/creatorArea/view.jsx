// @flow
import React from 'react';
import { useHistory } from 'react-router';
import { NavLink } from 'react-router-dom';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { lazyImport } from 'util/lazyImport';
import { formatLbryUrlForWeb } from 'util/url';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import Page from 'component/page';
import ChannelSelector from 'component/channelSelector';
import Button from 'component/button';
import TabWrapper from './internal/tabWrapper';
import { FormField } from 'component/common/form';
import './style.scss';
import { LocalStorage } from '../../../util/storage';
import { SETTINGS } from 'constants/icons';

const OverviewTab = lazyImport(() => import('./internal/overviewTab' /* webpackChunkName: "overviewTab" */));
const TiersTab = lazyImport(() => import('./internal/tiersTab' /* webpackChunkName: "tiersTab" */));
const SupportersTab = lazyImport(() => import('./internal/supportersTab' /* webpackChunkName: "supportersTab" */));
const PaymentsTab = lazyImport(() => import('./internal/paymentsTab'));
const TAB_QUERY = 'tab';

const TABS = {
  OVERVIEW: 'overview',
  SUPPORTERS: 'supporters',
  TIERS: 'tiers',
  PAYMENTS: 'payments',
};

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  myChannelClaims: ?Array<ChannelClaim>,
  supportersList: ?SupportersList,
  doListAllMyMembershipTiers: () => Promise<CreatorMemberships>,
  doGetMembershipSupportersList: () => void,
  monetizationEnabled: boolean,
  myChannelIds: Array<string>,
};

const CreatorArea = (props: Props) => {
  const {
    activeChannelClaim,
    myChannelClaims,
    supportersList,
    doListAllMyMembershipTiers,
    doGetMembershipSupportersList,
    monetizationEnabled,
    myChannelIds,
  } = props;

  const disabledMessage = __('Your memberships are disabled until you set up your wallet or enable monetization.');

  const [allSelected, setAllSelected] = React.useState(true);

  const [ackInfo, setAckArweavePaymentsInfo] = React.useState(LocalStorage.getItem(SETTINGS.ARWEAVE_PAYMENTS_INFO_ACK) || false);

  const handleAckArPaymentsInfo = (acked: boolean) => {
    LocalStorage.setItem(SETTINGS.ARWEAVE_PAYMENTS_INFO_ACK, acked);
    setAckArweavePaymentsInfo(acked);
  };
  const channelsToList = React.useMemo(() => {
    if (!myChannelClaims) return myChannelClaims;
    if (!activeChannelClaim) return activeChannelClaim;

    if (allSelected) return myChannelClaims;
    return [activeChannelClaim];
  }, [activeChannelClaim, allSelected, myChannelClaims]);

  React.useEffect(() => {
    if (myChannelClaims !== undefined) {
      doListAllMyMembershipTiers();
    }
  }, [doListAllMyMembershipTiers, myChannelClaims]);

  React.useEffect(() => {
    if (supportersList === undefined) {
      doGetMembershipSupportersList();
    }
  }, [doGetMembershipSupportersList, supportersList]);

  const {
    location: { search },
    push,
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  // if tiers are saved, then go to balance, otherwise go to tiers
  const currentView = urlParams.get(TAB_QUERY) || TABS.OVERVIEW;

  // based on query param or default, update value which will determine which tab to show
  let tabIndex = 0;
  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;
    case TABS.SUPPORTERS:
      tabIndex = 1;
      break;
    case TABS.TIERS:
      tabIndex = 2;
      break;
    case TABS.PAYMENTS:
      tabIndex = 3;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.SUPPORTERS}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.TIERS}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.PAYMENTS}`;
    }
    push(url);
  }

  const onChannelOverviewSelect = () => {
    setAllSelected(false);
    onTabChange(1);
  };

  const switchToTiersTab = () => onTabChange(2);

  return (
    <Page className="membershipPage-wrapper">
      <div className="creator-header-wrapper">
        <div className="creator-header">
          <Button
            navigate={`/$/${PAGES.MEMBERSHIPS_LANDING}`}
            icon={ICONS.BACK}
            button="liquidass"
          />
          <div>{__('Creator Portal')}</div>
        </div>
        <div className={'right-side'}>
          <Button button={'secondary'} className={!ackInfo ? 'creator-header__ack--active' : 'creator-header__ack--quiet'} label={!ackInfo ? 'X' : 'Help'} onClick={() => { handleAckArPaymentsInfo(!ackInfo) }} />

        </div>

      </div>
      {!ackInfo && (<div className={'membership-explainer'}>
        <h1>New Payments Info</h1>
        <div>
          <p>{__('Once you connect a new payment wallet, your subscribers will have one week to renew their membership.')}</p>
          <p> {__('You can now edit your existing tiers with a lower price, down to $0.1. Cannot make it higher.')}</p>
          <p>{__('If you need help bulk re-setting up members only content after adding new tiers or making changes, email us at hello@odysee.com')}</p>
        </div>
        <Button button={'primary'} label={'Got it'} onClick={() => { handleAckArPaymentsInfo(true) }} />
      </div>)}

      <Tabs onChange={onTabChange} index={tabIndex}>
        <div className="tab__wrapper">
          <TabList>
            <Tab aria-selected={tabIndex === 0} onClick={() => onTabChange(0)}>{__('Overview')}</Tab>
            <Tab aria-selected={tabIndex === 1} onClick={() => onTabChange(1)}>{__('My Supporters')}</Tab>
            <Tab aria-selected={tabIndex === 2} onClick={() => onTabChange(2)}>{__('My Tiers')}</Tab>
            <Tab aria-selected={tabIndex === 3} onClick={() => onTabChange(3)}>{__('Payments')}</Tab>
          </TabList>
        </div>

        <TabPanels>
          <TabPanel>
            <TabWrapper
              switchToTiersTab={switchToTiersTab}
              component={<>
                {!monetizationEnabled && (
                  <div className={'help'}>
                    <p>{disabledMessage}</p>
                    <NavLink to="/$/wallet">Set up wallet</NavLink>
                  </div>
                )}
                <OverviewTab onChannelSelect={onChannelOverviewSelect} />
              </>}
            />
          </TabPanel>

          <TabPanel>
            <TabWrapper
              switchToTiersTab={switchToTiersTab}
              component={
                <>
                  {!monetizationEnabled && (
                    <div className={'help'}>
                      <p>{disabledMessage}</p>
                      <NavLink to="/$/wallet">Set up wallet</NavLink>
                    </div>
                  )}
                  <span className="section__subtitle ">{__('Choose what channel to list supporters for')}</span>
                  <ChannelSelector
                    hideAnon
                    allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
                    onChannelSelect={() => setAllSelected(false)}
                  />

                  <SupportersTab channelsToList={channelsToList} switchToTiersTab={switchToTiersTab} />
                </>
              }
            />
          </TabPanel>

          <TabPanel>
            <TabWrapper
              component={
                <>
                  {!monetizationEnabled && (
                    <div className={'help'}>
                      <p>{disabledMessage}</p>
                      <NavLink to="/$/wallet">Set up wallet</NavLink>
                    </div>
                  )}
                  <div className="create-tiers-header-buttons">
                    <div className="create-tiers-channel-selector">
                      <span className="section__subtitle ">{__('Choose what channel to manage tiers for')}</span>
                      <ChannelSelector hideAnon onChannelSelect={() => { setAllSelected(false) }} />
                    </div>

                    <div className="create-tiers-preview-button">
                      <span className="section__subtitle ">{__('Preview your tiers')}</span>
                      <br />
                      <Button
                        navigate={`${formatLbryUrlForWeb(activeChannelClaim?.canonical_url)}?view=membership`}
                        label={__('See Your Memberships')}
                        icon={ICONS.BACK}
                        button="secondary"
                      />
                    </div>
                  </div>

                  <TiersTab />
                </>
              }
            />
          </TabPanel>
          <TabPanel>
            <TabWrapper
              component={
                <>
                  {!monetizationEnabled && (
                    <div className={'help'}>
                      <p>{disabledMessage}</p>
                      <NavLink to="/$/wallet">Set up wallet</NavLink>
                    </div>
                  )}
                  <div className="create-tiers-header-buttons">
                    <div className="create-tiers-channel-selector">
                      <span className="section__subtitle ">{__('Memberships for Channel...')}</span>
                      <ChannelSelector
                        channelIds={myChannelIds}
                        hideCreateNew
                        allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
                        hideAnon
                        onChannelSelect={() => setAllSelected(false)}
                      />
                    </div>
                  </div>

                  <PaymentsTab channelsToList={channelsToList} />
                </>
              }
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default CreatorArea;
