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

const CreateTiersTab = lazyImport(() => import('./internal/createTiersTab' /* webpackChunkName: "createTiersTab" */));
const CreatorMembershipsTab = lazyImport(() =>
  import('./internal/creatorMembershipsTab' /* webpackChunkName: "creatorMembershipsTab" */)
);
const MyPledgesTab = lazyImport(() => import('./internal/myPledgesTab' /* webpackChunkName: "myPledgesTab" */));
const MySupportersTab = lazyImport(() =>
  import('./internal/mySupportersTab' /* webpackChunkName: "mySupportersTab" */)
);

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
          <Tab>{__('Tiers')}</Tab>
          <Tab>{__('Supporters')}</Tab>
          <Tab>{__('My Pledges')}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ChannelSelector hideAnon />
            <CreatorMembershipsTab />
          </TabPanel>

          <TabPanel>
            <ChannelSelector hideAnon />
            <CreateTiersTab />
          </TabPanel>

          <TabPanel>
            <ChannelSelector hideAnon />
            <MySupportersTab />
          </TabPanel>

          <TabPanel>
            <ChannelSelector hideAnon />
            <MyPledgesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
