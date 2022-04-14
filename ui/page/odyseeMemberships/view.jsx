/* eslint-disable no-console */
// @flow
import React from 'react';
import Page from 'component/page';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import CreateTiersTab from 'component/creatorMemberships/membershipPage/createTiersTab';
import CreatorMembershipsTab from 'component/creatorMemberships/membershipPage/creatorMembershipsTab';
import MyPledgesTab from 'component/creatorMemberships/membershipPage/myPledgesTab';
import MySupportersTab from 'component/creatorMemberships/membershipPage/mySupportersTab';

const TAB_QUERY = 'tab';

const TABS = {
  MY_MEMBERSHIPS: 'my_memberships',
  CREATE_TIERS: 'create_tiers',
  MY_SUPPORTERS: 'my_supporters',
  MY_PLEDGES: 'my_pledges',
};

const MembershipsPage = (props: Props) => {
  const {
    location: { search },
    push,
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  // if tiers are saved, then go to balance, otherwise go to tiers
  const currentView = urlParams.get(TAB_QUERY) || TABS.MY_MEMBERSHIPS;

  // based on query param or default, update value which will determine which tab to show
  let tabIndex;
  switch (currentView) {
    case TABS.CREATE_TIERS:
      tabIndex = 1;
      break;
    case TABS.MY_SUPPORTERS:
      tabIndex = 2;
      break;
    case TABS.MY_PLEDGES:
      tabIndex = 3;
      break;
    case TABS.MY_MEMBERSHIPS:
    default:
      tabIndex = 0;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.CREATOR_MEMBERSHIPS}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.MY_MEMBERSHIPS}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.CREATE_TIERS}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.MY_SUPPORTERS}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.MY_PLEDGES}`;
    }
    push(url);
  }

  return (
    <Page className="premium-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('My Memberships')}</Tab>
          <Tab>{__('Create Tiers')}</Tab>
          <Tab>{__('My Supporters')}</Tab>
          <Tab>{__('My Pledges')}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <CreatorMembershipsTab />
          </TabPanel>

          <TabPanel>
            <CreateTiersTab />
          </TabPanel>

          <TabPanel>
            <MySupportersTab />
          </TabPanel>

          <TabPanel>
            <MyPledgesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
