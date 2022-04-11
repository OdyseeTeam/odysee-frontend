/* eslint-disable no-console */
// @flow
import React from 'react';
import Page from 'component/page';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import CreateTiersTab from 'component/creatorMemberships/createTiersTab';
import CreatorMembershipsTab from 'component/creatorMemberships/creatorMembershipsTab';
import MyPledgesTab from 'component/creatorMemberships/myPledgesTab';
import MySupportersTab from 'component/creatorMemberships/mySupportersTab';

const TAB_QUERY = 'tab';

const TABS = {
  MY_MEMBERSHIPS: 'my_memberships',
  CREATE_TIERS: 'create_tiers',
  MY_SUPPORTERS: 'my_supporters',
  MY_PLEDGES: 'my_pledges',
};

type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
};

const MembershipsPage = (props: Props) => {
  const {
  } = props;

  const {
    location: { search },
    push,
  } = useHistory();

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const urlParams = new URLSearchParams(search);

  // if tiers are saved, then go to balance, otherwise go to tiers
  const currentView = urlParams.get(TAB_QUERY) || TABS.MY_MEMBERSHIPS;

  // based on query param or default, update value which will determine which tab to show
  let tabIndex;
  switch (currentView) {
    case TABS.MY_MEMBERSHIPS:
      tabIndex = 0;
      break;
    case TABS.CREATE_TIERS:
      tabIndex = 1;
      break;
    case TABS.MY_SUPPORTERS:
      tabIndex = 2;
      break;
    case TABS.MY_PLEDGES:
      tabIndex = 3;
      break;
    default:
      tabIndex = 0;
      break;
  }

  // change the url based on the tab index value
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
    <>
      <Page className="premium-wrapper">
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('My Memberships')}</Tab>
            <Tab>{__('Create Tiers')}</Tab>
            <Tab>{__('My Supporters')}</Tab>
            <Tab>{__('My Pledges')}</Tab>
          </TabList>
          <TabPanels>

            {/** creator membership tab **/}
            <TabPanel>
              <CreatorMembershipsTab />
            </TabPanel>

            {/** create tiers tab **/}
            <TabPanel>
              <CreateTiersTab />
            </TabPanel>

            {/** my supporters tab **/}
            <TabPanel>
              <MySupportersTab />
            </TabPanel>

            {/** your pledges tab **/}
            <TabPanel>
              <MyPledgesTab />
            </TabPanel>

          </TabPanels>
        </Tabs>
      </Page>
    </>
  );
};

export default MembershipsPage;
