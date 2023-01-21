// @flow
import { Form } from 'component/common/form';
import LbcMessage from 'component/common/lbc-message';
import { Lbryio } from 'lbryinc';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';

import withCreditCard from 'hocs/withCreditCard';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const TAB_BOOST = 'TabBoost';
const TAB_FIAT = 'TabFiat';
const TAB_LBC = 'TabLBC';

type SupportParams = { amount: number, claim_id: string, channel_id?: string };
type TipParams = { tipAmount: number, tipChannelName: string, channelClaimId: string };
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };

type Props = {
  activeChannelId?: string,
  activeChannelName?: string,
  balance: number,
  claimId?: string,
  claimType?: string,
  channelClaimId?: string,
  tipChannelName?: string,
  claimIsMine: boolean,
  fetchingChannels: boolean,
  incognito: boolean,
  instantTipEnabled: boolean,
  instantTipMax: { amount: number, currency: string },
  isPending: boolean,
  isSupport: boolean,
  title: string,
  uri: string,
  isTipOnly?: boolean,
  hasSelectedTab?: string,
  customText?: string,
  doHideModal: () => void,
  doSendCashTip: (
    TipParams,
    anonymous: boolean,
    UserParams,
    claimId: string,
    stripe: ?string,
    preferredCurrency: string,
    ?(any) => void
  ) => string,
  doSendTip: (SupportParams, boolean) => void, // function that comes from lbry-redux
  setAmount?: (number) => void,
  preferredCurrency: string,
  modalProps?: any,
};

export default function WalletSendTip(props: Props) {
  const {
    activeChannelId,
    activeChannelName,
    balance,
    claimId,
    claimType,
    channelClaimId,
    tipChannelName,
    claimIsMine,
    fetchingChannels,
    incognito,
    instantTipEnabled,
    instantTipMax,
    isPending,
    title,
    uri,
    isTipOnly,
    hasSelectedTab,
    customText,
    doHideModal,
    doSendCashTip,
    doSendTip,
    setAmount,
    preferredCurrency,
    modalProps,
  } = props;

  /** WHAT TAB TO SHOW **/
  // if it's your content, we show boost, otherwise default is LBC
  const defaultTabToShow = claimIsMine ? TAB_BOOST : TAB_FIAT;

  // loads the default tab if nothing else is there yet
  const [persistentTab, setPersistentTab] = usePersistedState('send-tip-modal', defaultTabToShow);
  const [activeTab, setActiveTab] = React.useState(persistentTab);
  const [hasSelected, setSelected] = React.useState(false);

  /** STATE **/
  const [tipAmount, setTipAmount] = usePersistedState('comment-support:customTip', 1.0);
  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [tipError, setTipError] = React.useState();
  const [disableSubmitButton, setDisableSubmitButton] = React.useState();

  /** CONSTS **/
  const boostThisContentText = getBoostThisContentText();
  const boostYourContentText = getBoostYourContentText();
  const isSupport = claimIsMine || activeTab === TAB_BOOST;

  const { icon: fiatIconToUse, symbol: fiatSymbolToUse } = STRIPE.CURRENCY[preferredCurrency];

  // text for modal header
  const titleText = isSupport
    ? (claimIsMine ? boostYourContentText : boostThisContentText)
    : __('Leave a tip for the creator');

  let channelName;
  try {
    ({ channelName } = parseURI(uri));
  } catch (e) {}

  // icon to use or explainer text to show per tab
  let explainerText = '';
  switch (activeTab) {
    case TAB_BOOST:
      explainerText = getBoostExplainerText();
      break;
    case TAB_FIAT:
    case TAB_LBC:
      explainerText = __('Show this creator your appreciation by sending a donation.');
      break;
  }

  /** FUNCTIONS **/

  function getBoostExplainerText() {
    switch (claimType) {
      case 'stream':
        return __('This refundable boost will improve the discoverability of this content while active.');
      case 'channel':
        return __('This refundable boost will improve the discoverability of this channel while active.');
      case 'repost':
        return __('This refundable boost will improve the discoverability of this repost while active.');
      case 'collection':
        return __('This refundable boost will improve the discoverability of this playlist while active.');
      default:
        return __('This refundable boost will improve the discoverability of this claim while active.');
    }
  }

  function getBoostThisContentText() {
    switch (claimType) {
      case 'stream':
        return __('Boost this content');
      case 'channel':
        return __('Boost this channel');
      case 'repost':
        return __('Boost this repost');
      case 'collection':
        return __('Boost this playlist');
      default:
        return __('Boost this claim');
    }
  }

  function getBoostYourContentText() {
    switch (claimType) {
      case 'stream':
        return __('Boost your content');
      case 'channel':
        return __('Boost your channel');
      case 'repost':
        return __('Boost your repost');
      case 'collection':
        return __('Boost your playlist');
      default:
        return __('Boost your claim');
    }
  }

  // make call to the backend to send lbc or fiat
  function sendSupportOrConfirm(instantTipMaxAmount = null) {
    if (!isOnConfirmationPage && (!instantTipMaxAmount || !instantTipEnabled || tipAmount > instantTipMaxAmount)) {
      setConfirmationPage(true);
    } else {
      const supportParams: SupportParams = {
        amount: tipAmount,
        claim_id: claimId || '',
        channel_id: (!incognito && activeChannelId) || undefined,
      };

      // send tip/boost
      doSendTip(supportParams, isSupport);
      doHideModal();
    }
  }

  // when the form button is clicked
  function handleSubmit() {
    if (!tipAmount || !claimId) return;

    if (setAmount) {
      setAmount(tipAmount);
      doHideModal();
      return;
    }

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
        const tipParams: TipParams = {
          tipAmount,
          tipChannelName: tipChannelName || '',
          channelClaimId: channelClaimId || '',
        };
        const userParams: UserParams = { activeChannelName, activeChannelId };

        // hit backend to send tip
        doSendCashTip(
          tipParams,
          !activeChannelId || incognito,
          userParams,
          claimId,
          stripeEnvironment,
          preferredCurrency
        );
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
        return __('Send a %amount% Tip', { amount: `${fiatSymbolToUse}${displayAmount}` });
      case TAB_LBC:
        return __('Send a %amount% Tip', { amount: `${displayAmount} LBC` });
      default:
        return titleText;
    }
  }

  React.useEffect(() => {
    if (!hasSelected && hasSelectedTab && activeTab !== hasSelectedTab) {
      setActiveTab(claimIsMine ? TAB_BOOST : hasSelectedTab);
      setSelected(true);
    }
  }, [activeTab, claimIsMine, hasSelected, hasSelectedTab, setActiveTab]);

  React.useEffect(() => {
    if (!hasSelectedTab && activeTab !== hasSelectedTab) {
      setPersistentTab(claimIsMine ? TAB_BOOST : activeTab);
    }
  }, [activeTab, claimIsMine, hasSelectedTab, setPersistentTab]);

  /** RENDER **/

  const tabButtonProps = { isOnConfirmationPage, activeTab, setActiveTab };

  return (
    <Form onSubmit={handleSubmit}>
      {/* if there is no LBC balance, show user frontend to get credits */}
      {/* if there is lbc, the main tip/boost gui with the 3 tabs at the top */}
      <Card
        title={titleText}
        className={'wallet-send-tip-modal'}
        subtitle={
          <>
            {!claimIsMine && (
              <div className="section">
                {/* tip fiat tab button */}
                {stripeEnvironment && (
                  <TabSwitchButton icon={fiatIconToUse} label={__('Tip')} name={TAB_FIAT} {...tabButtonProps} />
                )}

                {/* tip LBC tab button */}
                <TabSwitchButton icon={ICONS.LBC} label={__('Tip')} name={TAB_LBC} {...tabButtonProps} />

                {/* support LBC tab button */}
                {!isTipOnly && (
                  <TabSwitchButton icon={ICONS.TRENDING} label={__('Boost')} name={TAB_BOOST} {...tabButtonProps} />
                )}
              </div>
            )}

            {/* short explainer under the button */}
            <div className="section__subtitle">
              {explainerText}{' '}
              <Button label={__('Learn more')} button="link" href="https://help.odysee.tv/category-monetization/" />
            </div>
          </>
        }
        actions={
          // confirmation modal, allow  user to confirm or cancel transaction
          isOnConfirmationPage ? (
            <>
              <div className="section card--inline confirm__wrapper">
                <div className="section">
                  <div className="confirm__label">{__('To --[the tip recipient]--')}</div>
                  <div className="confirm__value">{channelName || title}</div>
                  <div className="confirm__label">{__('From --[the tip sender]--')}</div>
                  <div className="confirm__value">{(!incognito && activeChannelName) || __('Anonymous')}</div>
                  <div className="confirm__label">{__('Amount')}</div>
                  <div className="confirm__value">
                    {activeTab === TAB_FIAT ? (
                      <p>{`${fiatSymbolToUse} ${(Math.round(tipAmount * 100) / 100).toFixed(2)}`}</p>
                    ) : (
                      <LbcSymbol postfix={tipAmount} size={22} />
                    )}
                  </div>
                </div>
              </div>
              <div className="section__actions">
                {activeTab === TAB_FIAT ? (
                  <SubmitCashTipButton handleSubmit={handleSubmit} isPending={isPending} />
                ) : (
                  <Button
                    autoFocus
                    onClick={handleSubmit}
                    button="primary"
                    disabled={isPending}
                    label={__('Confirm')}
                  />
                )}
                <Button button="link" label={__('Cancel')} onClick={() => setConfirmationPage(false)} />
              </div>
            </>
          ) : !((activeTab === TAB_LBC || activeTab === TAB_BOOST) && balance === 0) ? (
            <>
              <ChannelSelector />

              {/* section to pick tip/boost amount */}
              <WalletTipAmountSelector
                setTipError={setTipError}
                tipError={tipError}
                uri={uri}
                activeTab={activeTab === TAB_BOOST ? TAB_LBC : activeTab}
                amount={tipAmount}
                onChange={(amount) => setTipAmount(amount)}
                setDisableSubmitButton={setDisableSubmitButton}
                modalProps={modalProps}
              />

              {/* send tip/boost button */}
              <div className="section__actions">
                <Button
                  autoFocus
                  icon={isSupport ? ICONS.TRENDING : ICONS.SUPPORT}
                  button="primary"
                  type="submit"
                  disabled={fetchingChannels || isPending || tipError || !tipAmount || disableSubmitButton}
                  label={<LbcMessage>{customText || buildButtonText()}</LbcMessage>}
                />
                {fetchingChannels && <span className="help">{__('Loading your channels...')}</span>}
              </div>
            </>
          ) : (
            // if it's LBC and there is no balance, you can prompt to purchase LBC
            <Card
              title={
                <I18nMessage tokens={{ lbc: <LbcSymbol size={22} /> }}>Supporting content requires %lbc%</I18nMessage>
              }
              subtitle={
                <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
                  With %lbc%, you can send tips to your favorite creators, or help boost their content for more people
                  to see.
                </I18nMessage>
              }
              actions={
                <div className="section__actions">
                  <Button
                    icon={ICONS.REWARDS}
                    button="primary"
                    label={__('Earn Rewards')}
                    navigate={`/$/${PAGES.REWARDS}`}
                  />
                  <Button
                    icon={ICONS.BUY}
                    button="secondary"
                    label={__('Buy/Swap Credits')}
                    navigate={`/$/${PAGES.BUY}`}
                  />
                </div>
              }
            />
          )
        }
      />
    </Form>
  );
}

type TabButtonProps = {
  icon: string,
  label: string,
  name: string,
  isOnConfirmationPage: boolean,
  activeTab: string,
  setActiveTab: (string) => void,
};

const TabSwitchButton = (tabButtonProps: TabButtonProps) => {
  const { icon, label, name, isOnConfirmationPage, activeTab, setActiveTab } = tabButtonProps;
  return (
    <Button
      key={name}
      icon={icon}
      label={label}
      button="alt"
      onClick={() => {
        const tipInputElement = document.getElementById('tip-input');
        if (tipInputElement) tipInputElement.focus();
        if (!isOnConfirmationPage) setActiveTab(name);
      }}
      className={classnames('button-toggle', { 'button-toggle--active': activeTab === name })}
    />
  );
};

const SubmitCashTipButton = withCreditCard(
  ({ isPending, handleSubmit }: { isPending: boolean, handleSubmit: () => void }) => (
    <Button autoFocus disabled={isPending} onClick={handleSubmit} button="primary" label={__('Confirm')} />
  )
);
