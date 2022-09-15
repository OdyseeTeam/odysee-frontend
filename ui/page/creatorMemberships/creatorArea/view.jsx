/* eslint-disable no-console */
// @flow
import React from 'react';

import { useHistory } from 'react-router';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { lazyImport } from 'util/lazyImport';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import Page from 'component/page';
import ChannelSelector from 'component/channelSelector';
import Spinner from 'component/spinner';
import Button from 'component/button';
import Icon from 'component/common/icon';

import './style.scss';

const OverviewTab = lazyImport(() => import('./overviewTab' /* webpackChunkName: "overviewTab" */));
const TiersTab = lazyImport(() => import('./tiersTab' /* webpackChunkName: "tiersTab" */));
const PledgesTab = lazyImport(() => import('../supporterArea/pledgesTab' /* webpackChunkName: "pledgesTab" */));
const SupportersTab = lazyImport(() => import('./supportersTab' /* webpackChunkName: "supportersTab" */));

const TAB_QUERY = 'tab';

const TABS = {
  OVERVIEW: 'overview',
  SUPPORTERS: 'supporters',
  TIERS: 'tiers',
};

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  bankAccountConfirmed: ?boolean,
  myChannelClaims: ?Array<ChannelClaim>,
  hasTiers: ?boolean,
  doTipAccountStatus: (any) => void,
  doListAllMyMembershipTiers: () => Promise<CreatorMemberships>,
};

const MembershipsPage = (props: Props) => {
  const {
    bankAccountConfirmed,
    activeChannelClaim,
    myChannelClaims,
    hasTiers,
    doTipAccountStatus,
    doListAllMyMembershipTiers,
  } = props;

  const [allSelected, setAllSelected] = React.useState(false);

  const channelsToList = React.useMemo(() => {
    if (!myChannelClaims) return myChannelClaims;
    if (!activeChannelClaim) return activeChannelClaim;

    if (allSelected) return myChannelClaims;
    return [activeChannelClaim];
  }, [activeChannelClaim, allSelected, myChannelClaims]);

  React.useEffect(() => {
    if (bankAccountConfirmed === undefined) {
      doTipAccountStatus({ getBank: true }); // todo: refactor this getBank
    }
  }, [bankAccountConfirmed, doTipAccountStatus]);

  React.useEffect(() => {
    if (myChannelClaims !== undefined) {
      doListAllMyMembershipTiers();
    }
  }, [doListAllMyMembershipTiers, myChannelClaims]);

  const {
    location: { search },
    push,
  } = useHistory();

  if (activeChannelClaim === undefined || bankAccountConfirmed === undefined) {
    return (
      <Page className="premium-wrapper">
        <div className="main--empty">
          <Spinner />
        </div>
      </Page>
    );
  }

  const urlParams = new URLSearchParams(search);
  // if tiers are saved, then go to balance, otherwise go to tiers
  const currentView = urlParams.get(TAB_QUERY) || TABS.OVERVIEW;

  // based on query param or default, update value which will determine which tab to show
  let tabIndex = 0;
  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;
    case TABS.TIERS:
      if (activeChannelClaim !== null) tabIndex = 1;
      break;
    case TABS.SUPPORTERS:
      if (hasTiers) tabIndex = 2;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (activeChannelClaim !== null && newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.TIERS}`;
    } else if (newTabIndex === 2 && hasTiers) {
      url += `${TAB_QUERY}=${TABS.SUPPORTERS}`;
    }
    push(url);
  }

  return (
    <Page className="premium-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('Overview')}</Tab>
          <Tab>{activeChannelClaim !== null && __('My Tiers')}</Tab>
          <Tab>{activeChannelClaim !== null && hasTiers && __('My Supporters')}</Tab>
          <div className="no-after">
            <Tab>
              <Button
                navigate={`/$/${PAGES.MEMBERSHIPS_LANDING}`}
                label={__('Back To Memberships')}
                icon={ICONS.SIGN_OUT}
                button="secondary"
              />

              {/*<a href={`/$/${PAGES.MEMBERSHIPS_LANDING}`}>*/}
              {/*  {activeChannelClaim !== null && hasTiers && __(' Back To Memberships')}*/}
              {/*  <Icon className="back-to-memberships-button" icon={ICONS.SIGN_OUT} />*/}
              {/*</a>*/}
            </Tab>
          </div>
        </TabList>
        <TabPanels>
          <TabPanel>
            <span className="section__subtitle ">{__('View information for a specific channel')}</span>
            <ChannelSelector
              hideAnon
              allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
              onChannelSelect={() => setAllSelected(false)}
            />
            <div style={{ marginTop: 'var(--spacing-l)' }}>
              <OverviewTab channelsToList={channelsToList} onTabChange={onTabChange} hasTiers={hasTiers} />
            </div>
            {/*<div style={{ marginTop: 'var(--spacing-xxl)' }}>*/}
            {/*  <PledgesTab />*/}
            {/*</div>*/}
          </TabPanel>

          {/* create tiers tab */}
          <TabPanel>
            {activeChannelClaim !== null && (
              <>
                <span className="section__subtitle ">{__('Choose what channel to create tiers for')}</span>
                <ChannelSelector hideAnon onChannelSelect={() => setAllSelected(false)} />
                <TiersTab />
              </>
            )}
          </TabPanel>

          {/* my supporters tab */}
          <TabPanel>
            {activeChannelClaim !== null && hasTiers && (
              <>
                <span className="section__subtitle ">{__('Choose what channel to list supporters for')}</span>
                <ChannelSelector
                  hideAnon
                  allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
                  onChannelSelect={() => setAllSelected(false)}
                />
                <SupportersTab channelsToList={channelsToList} onTabChange={onTabChange} />
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
