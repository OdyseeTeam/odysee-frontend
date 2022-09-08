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
  TIERS: 'tiers',
  SUPPORTERS: 'supporters',
  PLEDGES: 'pledges',
};

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  bankAccountConfirmed: ?boolean,
  doTipAccountStatus: (any) => void,
};

const MembershipsPage = (props: Props) => {
  const { bankAccountConfirmed, doTipAccountStatus, activeChannelClaim } = props;

  React.useEffect(() => {
    if (bankAccountConfirmed === undefined) {
      doTipAccountStatus({ getBank: true }); // todo: refactor this getBank
    }
  }, [bankAccountConfirmed, doTipAccountStatus]);

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
  let tabIndex;
  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;
    case TABS.TIERS:
      tabIndex = 1;
      break;
    case TABS.SUPPORTERS:
      tabIndex = 2;
      break;
    case TABS.PLEDGES:
      tabIndex = 3;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.TIERS}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.SUPPORTERS}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.PLEDGES}`;
    }
    push(url);
  }

  return (
    <Page className="premium-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('Overview')}</Tab>
          <Tab>{activeChannelClaim !== null && __('Tiers')}</Tab>
          <Tab>{activeChannelClaim !== null && __('Supporters')}</Tab>
          <Tab>{__('My Pledges')}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <OverviewTab />
          </TabPanel>

          <TabPanel>
            {activeChannelClaim !== null && (
              <>
                <ChannelSelector hideAnon />
                <TiersTab />
              </>
            )}
          </TabPanel>

          <TabPanel>
            {activeChannelClaim !== null && (
              <>
                <ChannelSelector hideAnon />
                <SupportersTab />
              </>
            )}
          </TabPanel>

          <TabPanel>
            <ChannelSelector hideAnon />
            <PledgesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
