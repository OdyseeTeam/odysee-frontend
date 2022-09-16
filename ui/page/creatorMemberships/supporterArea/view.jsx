/* eslint-disable no-console */
// @flow
import React from 'react';

import { useHistory } from 'react-router';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { lazyImport } from 'util/lazyImport';
import HelpHub from 'component/common/help-hub';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import Page from 'component/page';
import ChannelSelector from 'component/channelSelector';
import Spinner from 'component/spinner';
import Button from 'component/button';
// import Icon from 'component/common/icon';

import './style.scss';

const PledgesTab = lazyImport(() => import('./pledgesTab' /* webpackChunkName: "pledgesTab" */));

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
    // hasTiers,
    doTipAccountStatus,
    doListAllMyMembershipTiers,
  } = props;

  const [allSelected, setAllSelected] = React.useState(false);

  // const channelsToList = React.useMemo(() => {
  //   if (!myChannelClaims) return myChannelClaims;
  //   if (!activeChannelClaim) return activeChannelClaim;

  //   if (allSelected) return myChannelClaims;
  //   return [activeChannelClaim];
  // }, [activeChannelClaim, allSelected, myChannelClaims]);

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
      tabIndex = 2;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.MEMBERSHIPS_SUPPORTER}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.TIERS}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.SUPPORTERS}`;
    }
    push(url);
  }

  return (
    <Page className="membershipPage-wrapper">
      <div className="membership__mypledges-header">
        <div />
        <label>Donor Portal</label>
      </div>
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__("Overview")}</Tab>
          <Tab>{__('Billing History')}</Tab>
          <Tab> {__('Creators To Support')}</Tab>
          <div>
            <Tab>
              <Button
                navigate={`/$/${PAGES.MEMBERSHIPS_LANDING}`}
                label={__('Back To Memberships')}
                icon={ICONS.SIGN_OUT}
                button="secondary"
              />
            </Tab>
          </div>
        </TabList>
        <TabPanels>
          {/* my pledges tab (creators I'm supporting) */}
          <TabPanel>
            {/*
            <span className="section__subtitle ">{__('View information for a specific channel')}</span>
            <ChannelSelector
              hideAnon
              allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
              onChannelSelect={() => setAllSelected(false)}
            />
            */}

            <PledgesTab />
            <HelpHub href="https://help.odysee.tv/category-memberships/" image="lady_fungus.png" text="What are these donations? Lady Fungus can explain it in the %help_hub%." />
          </TabPanel>

          {/* billing history tab */}
          <TabPanel>
            <>
              <span className="section__subtitle ">{__('Choose what channel to create tiers for')}</span>
              <ChannelSelector hideAnon onChannelSelect={() => setAllSelected(false)} />
            </>
          </TabPanel>

          {/* creators to support tab */}
          <TabPanel>
            <>
              {/*
              <span className="section__subtitle ">{__('Choose what channel to list supporters for')}</span>
              <ChannelSelector
                hideAnon
                allOptionProps={{ onSelectAll: () => setAllSelected(true), isSelected: allSelected }}
                onChannelSelect={() => setAllSelected(false)}
              />
              */}              
            </>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
