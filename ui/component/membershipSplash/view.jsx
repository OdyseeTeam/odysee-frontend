// @flow
import { Form } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';

import AstronautAndFriends from './astronaut_n_friends.png';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const TAB_BOOST = 'TabBoost';
const TAB_FIAT = 'TabFiat';
const TAB_LBC = 'TabLBC';
type SupportParams = { amount: number, claim_id: string, channel_id?: string };
type TipParams = { tipAmount: number, tipChannelName: string, channelClaimId: string };
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };

type Props = {
  activeChannelClaim: ?ChannelClaim,
  balance: number,
  claim: StreamClaim,
  claimIsMine: boolean,
  fetchingChannels: boolean,
  incognito: boolean,
  instantTipEnabled: boolean,
  instantTipMax: { amount: number, currency: string },
  isPending: boolean,
  isSupport: boolean,
  title: string,
  uri: string,
  doHideModal: () => void,
  doSendCashTip: (TipParams, boolean, UserParams, string, ?string) => string,
  doSendTip: (SupportParams, boolean) => void, // function that comes from lbry-redux
};

function WalletSendTip(props: Props) {
  const {
    activeChannelClaim,
    balance,
    claim = {},
    claimIsMine,
    fetchingChannels,
    incognito,
    instantTipEnabled,
    instantTipMax,
    isPending,
    title,
    uri,
    doHideModal,
    doSendCashTip,
    doSendTip,
  } = props;

  /** WHAT TAB TO SHOW **/
  // set default tab to for new users based on if it's their claim or not
  let defaultTabToShow;
  if (claimIsMine) {
    defaultTabToShow = TAB_BOOST;
  } else {
    defaultTabToShow = TAB_LBC;
  }

  // loads the default tab if nothing else is there yet
  const [activeTab, setActiveTab] = usePersistedState(defaultTabToShow);

  // if a broken default is set, set it to the proper default
  if (activeTab !== TAB_BOOST && activeTab !== TAB_LBC && activeTab !== TAB_FIAT) {
    // if the claim is the user's set it to boost
    setActiveTab(defaultTabToShow);
  }

  // if the claim is yours but the active tab is not boost, change it to boost
  if (claimIsMine && activeTab !== TAB_BOOST) {
    setActiveTab(TAB_BOOST);
  }

  /** STATE **/
  const [tipAmount, setTipAmount] = usePersistedState('comment-support:customTip', 1.0);
  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [tipError, setTipError] = React.useState();
  const [disableSubmitButton, setDisableSubmitButton] = React.useState();

  /** CONSTS **/
  const claimTypeText = getClaimTypeText();
  const isSupport = claimIsMine || activeTab === TAB_BOOST;
  const titleText = claimIsMine
    ? __('Boost Your %claimTypeText%', { claimTypeText })
    : __('Boost This %claimTypeText%', { claimTypeText });
  const { claim_id: claimId } = claim;
  let channelName;
  try {
    ({ channelName } = parseURI(uri));
  } catch (e) {}
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;

  // setup variables for backend tip API
  const channelClaimId = claim.signing_channel ? claim.signing_channel.claim_id : claim.claim_id;
  const tipChannelName = claim.signing_channel ? claim.signing_channel.name : claim.name;

  // icon to use or explainer text to show per tab
  let explainerText = '',
    confirmLabel = '';
  switch (activeTab) {
    case TAB_BOOST:
      explainerText = __(
        'This refundable boost will improve the discoverability of this %claimTypeText% while active. ',
        { claimTypeText }
      );
      confirmLabel = __('Boosting');
      break;
    case TAB_FIAT:
      explainerText = __('Show this channel your appreciation by sending a donation in USD. ');
      confirmLabel = __('Tipping Fiat (USD)');
      break;
    case TAB_LBC:
      explainerText = __('Show this channel your appreciation by sending a donation of Credits. ');
      confirmLabel = __('Tipping Credit');
      break;
  }

  /** FUNCTIONS **/

  function getClaimTypeText() {
    switch (claim.value_type) {
      case 'stream':
        return __('Content');
      case 'channel':
        return __('Channel');
      case 'repost':
        return __('Repost');
      case 'collection':
        return __('List');
      default:
        return __('Claim');
    }
  }

  // make call to the backend to send lbc or fiat
  function sendSupportOrConfirm(instantTipMaxAmount = null) {
    if (!isOnConfirmationPage && (!instantTipMaxAmount || !instantTipEnabled || tipAmount > instantTipMaxAmount)) {
      setConfirmationPage(true);
    } else {
      const supportParams: SupportParams = {
        amount: tipAmount,
        claim_id: claimId,
        channel_id: activeChannelClaim && !incognito ? activeChannelClaim.claim_id : undefined,
      };

      // send tip/boost
      doSendTip(supportParams, isSupport);
      doHideModal();
    }
  }

  // when the form button is clicked
  function handleSubmit() {
    if (!tipAmount || !claimId) return;

    // send an instant tip (no need to go to an exchange first)
    if (instantTipEnabled && activeTab !== TAB_FIAT) {
      if (instantTipMax.currency === 'LBC') {
        sendSupportOrConfirm(instantTipMax.amount);
      } else {
        // Need to convert currency of instant purchase maximum before trying to send support
        Lbryio.getExchangeRates().then(({ LBC_USD }) => sendSupportOrConfirm(instantTipMax.amount / LBC_USD));
      }
      // sending fiat tip
    } else if (activeTab === TAB_FIAT) {
      if (!isOnConfirmationPage) {
        setConfirmationPage(true);
      } else {
        const tipParams: TipParams = { tipAmount, tipChannelName, channelClaimId };
        const userParams: UserParams = { activeChannelName, activeChannelId };

        // hit backend to send tip
        doSendCashTip(tipParams, !activeChannelClaim || incognito, userParams, claimId, stripeEnvironment);
        doHideModal();
      }
      // if it's a boost (?)
    } else {
      sendSupportOrConfirm();
    }
  }

  function buildButtonText() {
    // test if frontend will show up as isNan
    function isNan(tipAmount) {
      // testing for NaN ES5 style https://stackoverflow.com/a/35912757/3973137
      // also sometimes it's returned as a string
      // eslint-disable-next-line
      return tipAmount !== tipAmount || tipAmount === 'NaN';
    }

    function convertToTwoDecimals(number) {
      return (Math.round(number * 100) / 100).toFixed(2);
    }

    const amountToShow = activeTab === TAB_FIAT ? convertToTwoDecimals(tipAmount) : tipAmount;

    // if it's a valid number display it, otherwise do an empty string
    const displayAmount = !isNan(tipAmount) ? amountToShow : '';

    // build button text based on tab
    switch (activeTab) {
      case TAB_BOOST:
        return titleText;
      case TAB_FIAT:
        return __('Send a $%displayAmount% Tip', { displayAmount });
      case TAB_LBC:
        return __('Send a %displayAmount% Credit Tip', { displayAmount });
    }
  }

  /** RENDER **/

  const getTabButton = (tabIcon: string, tabLabel: string, tabName: string) => (
    <Button
      key={tabName}
      icon={tabIcon}
      label={tabLabel}
      button="alt"
      onClick={() => {
        const tipInputElement = document.getElementById('tip-input');
        if (tipInputElement) tipInputElement.focus();
        if (!isOnConfirmationPage) setActiveTab(tabName);
      }}
      className={classnames('button-toggle', { 'button-toggle--active': activeTab === tabName })}
    />
  );

  const logo = <Icon className="header__logo" icon={ICONS.ODYSEE_WHITE_TEXT} />;
  const earlyAcessInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.EARLY_ACCESS} />
      {__('Early access to features')}
    </div>
  );
  const badgeInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.MEMBER_BADGE} />
      {__('Badge on profile')}
    </div>
  );
  const noAdsInfo = (
    <div className="membership-splash__info-content">
      <Icon icon={ICONS.NO_ADS} />
      {__('No ads')}
    </div>
  );

  return (
    <>
      <div className="membership-splash__banner">
        <img src={AstronautAndFriends} />

        <section>
          {logo}
          <span className="membership-splash__title">{__('PREMIUM')}</span>
        </section>

        <section>{__('Get early access and features and remove ads for 99c')}</section>
      </div>

      <div className="membership-splash__info">{__('creating a .....')}</div>

      <div className="membership-splash__info">
        <section className="membership-splash__info-header">{__('99c A MONTH')}</section>

        {badgeInfo}

        {earlyAcessInfo}

        <Button button="primary" label={__('Apply for Membership')} />
      </div>

      <div className="membership-splash__info">
        <section className="membership-splash__info-header">{__('99c A MONTH')}</section>

        {noAdsInfo}

        {badgeInfo}

        {earlyAcessInfo}

        <Button button="primary" label={__('Apply for Membership')} />
      </div>
    </>
  );
}

export default WalletSendTip;
