import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import './style.scss';
import { LocalStorage } from '../../../util/storage';
import { SETTINGS } from 'constants/icons';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMyChannelClaimIds, selectMyChannelClaims } from 'redux/selectors/claims';
import { selectMySupportersList } from 'redux/selectors/memberships';
import {
  doListAllMyMembershipTiers as doListAllMyMembershipTiersAction,
  doGetMembershipSupportersList as doGetMembershipSupportersListAction,
} from 'redux/actions/memberships';
import { selectArweaveDefaultAccountMonetizationEnabled } from 'redux/selectors/stripe';
const OverviewTab = lazyImport(
  () =>
    import(
      './internal/overviewTab'
      /* webpackChunkName: "overviewTab" */
    )
);
const TiersTab = lazyImport(
  () =>
    import(
      './internal/tiersTab'
      /* webpackChunkName: "tiersTab" */
    )
);
const SupportersTab = lazyImport(
  () =>
    import(
      './internal/supportersTab'
      /* webpackChunkName: "supportersTab" */
    )
);
const PaymentsTab = lazyImport(() => import('./internal/paymentsTab'));
const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  SUPPORTERS: 'supporters',
  TIERS: 'tiers',
  PAYMENTS: 'payments',
};
type Props = {};

const CreatorArea = (props: Props) => {
  const dispatch = useAppDispatch();
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const myChannelIds = useAppSelector(selectMyChannelClaimIds);
  const myChannelClaims = useAppSelector(selectMyChannelClaims);
  const supportersList = useAppSelector(selectMySupportersList);
  const monetizationEnabled = useAppSelector(selectArweaveDefaultAccountMonetizationEnabled);
  const doListAllMyMembershipTiers = () => dispatch(doListAllMyMembershipTiersAction());
  const doGetMembershipSupportersList = () => dispatch(doGetMembershipSupportersListAction());
  const navigate = useNavigate();
  const { search } = useLocation();
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

    navigate(url);
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
          <Button navigate={`/$/${PAGES.MEMBERSHIPS_LANDING}`} icon={ICONS.BACK} button="liquidass" />
          <div>{__('Creator Portal')}</div>
        </div>
        <div className={'right-side'}>
          <Button
            button={'secondary'}
            className={!ackInfo ? 'creator-header__ack--active' : 'creator-header__ack--quiet'}
            label={!ackInfo ? 'X' : 'Help'}
            onClick={() => {
              handleAckArPaymentsInfo(!ackInfo);
            }}
          />
        </div>
      </div>
      {!ackInfo && (
        <div className={'membership-explainer'}>
          <h1>New Payments Info</h1>
          <div>
            <p>
              {__(
                'Once you connect a new payment wallet, your subscribers will have one week to renew their membership.'
              )}
            </p>
            <p>
              {' '}
              {__('You can now edit your existing tiers with a lower price, down to $0.1. Cannot make it higher.')}
            </p>
            <p>
              {__(
                'If you need help bulk re-setting up members only content after adding new tiers or making changes, email us at hello@odysee.com'
              )}
            </p>
          </div>
          <Button
            button={'primary'}
            label={'Got it'}
            onClick={() => {
              handleAckArPaymentsInfo(true);
            }}
          />
        </div>
      )}

      <Tabs onChange={onTabChange} index={tabIndex}>
        <div className="tab__wrapper">
          <TabList>
            <Tab aria-selected={tabIndex === 0} onClick={() => onTabChange(0)}>
              {__('Overview')}
            </Tab>
            <Tab aria-selected={tabIndex === 1} onClick={() => onTabChange(1)}>
              {__('My Supporters')}
            </Tab>
            <Tab aria-selected={tabIndex === 2} onClick={() => onTabChange(2)}>
              {__('My Tiers')}
            </Tab>
            <Tab aria-selected={tabIndex === 3} onClick={() => onTabChange(3)}>
              {__('Payments')}
            </Tab>
          </TabList>
        </div>

        <TabPanels>
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
                  <OverviewTab onChannelSelect={onChannelOverviewSelect} />
                </>
              }
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
                    allOptionProps={{
                      onSelectAll: () => setAllSelected(true),
                      isSelected: allSelected,
                    }}
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
                      <ChannelSelector
                        hideAnon
                        onChannelSelect={() => {
                          setAllSelected(false);
                        }}
                      />
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
                        allOptionProps={{
                          onSelectAll: () => setAllSelected(true),
                          isSelected: allSelected,
                        }}
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
