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
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
};

const MembershipsPage = (props: Props) => {
  const {
    bankAccountConfirmed,
    activeChannelClaim,
    myChannelClaims,
    hasTiers,
    doTipAccountStatus,
    doMembershipList,
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
    if (activeChannelClaim) {
      doMembershipList({ channel_name: activeChannelClaim.name, channel_id: activeChannelClaim.claim_id });
    }
  }, [activeChannelClaim, doMembershipList]);

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
    case TABS.SUPPORTERS:
      tabIndex = 1;
      break;
    case TABS.TIERS:
      tabIndex = 2;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    console.log('tabchange index: ', newTabIndex);

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.SUPPORTERS}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.TIERS}`;
    }
    push(url);
  }

  // If true we want the entire page to be aimed at creators. Otherwise it will be aimed at users.
  const showMySupporters = hasTiers || tabIndex === 2 || allSelected;

  return (
    <Page className="premium-wrapper">
      {hasTiers ? (
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('Overview')}</Tab>
            <Tab>{activeChannelClaim !== null && showMySupporters && __('My Supporters')}</Tab>
            <Tab>{activeChannelClaim !== null && __('My Tiers')}</Tab>
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
              {activeChannelClaim !== null && showMySupporters && (
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

            <TabPanel>
              {activeChannelClaim !== null && (
                <>
                  <ChannelSelector hideAnon onChannelSelect={() => setAllSelected(false)} />
                  <TiersTab />
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('Overview')}</Tab>
            <Tab>{activeChannelClaim !== null && __('My Tiers')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ChannelSelector
                hideAnon
                allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
                onChannelSelect={() => setAllSelected(false)}
              />
              <div style={{ marginTop: 'var(--spacing-l)' }}>
                <PledgesTab />
              </div>
              <div style={{ marginTop: 'var(--spacing-xxl)' }}>
                <OverviewTab channelsToList={channelsToList} onTabChange={onTabChange} hasTiers={hasTiers} />
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
          </TabPanels>
        </Tabs>
      )}
    </Page>
  );
};

export default MembershipsPage;
