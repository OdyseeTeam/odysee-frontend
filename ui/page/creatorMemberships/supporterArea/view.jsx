// @flow
import React from 'react';

import { useHistory } from 'react-router';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { lazyImport } from 'util/lazyImport';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import Page from 'component/page';
import Spinner from 'component/spinner';
import Button from 'component/button';

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
    hasTiers,
    doTipAccountStatus,
    doListAllMyMembershipTiers,
  } = props;

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
          <Tab>{__('My Pledges')}</Tab>
          <div className="no-after">
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
          <TabPanel>
            <PledgesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default MembershipsPage;
