/* eslint-disable no-console */
// @flow
import React from 'react';

import { useHistory } from 'react-router';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { lazyImport } from 'util/lazyImport';

import * as PAGES from 'constants/pages';

import Page from 'component/page';
import ChannelSelector from 'component/channelSelector';
import Spinner from 'component/spinner';

const OverviewTab = lazyImport(() => import('./internal/overviewTab' /* webpackChunkName: "overviewTab" */));
const TiersTab = lazyImport(() => import('./internal/tiersTab' /* webpackChunkName: "tiersTab" */));
const PledgesTab = lazyImport(() => import('./internal/pledgesTab' /* webpackChunkName: "pledgesTab" */));
const SupportersTab = lazyImport(() => import('./internal/supportersTab' /* webpackChunkName: "supportersTab" */));

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
      tabIndex = 1;
      break;
    case TABS.SUPPORTERS:
      if (hasTiers) tabIndex = 2;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
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
        </TabList>
        <TabPanels>
          <TabPanel>
            <ChannelSelector
              hideAnon
              allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
              onChannelSelect={() => setAllSelected(false)}
            />
            <div style={{ marginTop: 'var(--spacing-l)' }}>
              <OverviewTab channelsToList={channelsToList} onTabChange={onTabChange} hasTiers={hasTiers} />
            </div>
            <div style={{ marginTop: 'var(--spacing-xxl)' }}>
              <PledgesTab />
            </div>
          </TabPanel>

          <TabPanel>
            {activeChannelClaim !== null && (
              <>
                <ChannelSelector hideAnon onChannelSelect={() => setAllSelected(false)} />
                <TiersTab />
              </>
            )}
          </TabPanel>

          <TabPanel>
            {activeChannelClaim !== null && hasTiers && (
              <>
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
