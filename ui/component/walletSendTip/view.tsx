import React from 'react';
import { ENABLE_ARCONNECT } from 'config';
import { Lbryio } from 'lbryinc';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { TAB_USD, TAB_BOOST } from 'constants/tip_tabs';
import { Form } from 'component/common/form';
import LbcMessage from 'component/common/lbc-message';
import Button from 'component/button';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';
import WalletStatus from 'component/walletStatus';
import usePersistedState from 'effects/use-persisted-state';
import { useArStatus } from 'effects/use-ar-status';
import classnames from 'classnames';
import { getStripeEnvironment } from 'util/stripe';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectTitleForUri,
  selectClaimForUri,
  selectClaimIsMineForUri,
  selectFetchingMyChannels,
} from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';
import { doSendTip } from 'redux/actions/wallet';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectBalance, selectIsSendingSupport } from 'redux/selectors/wallet';
import * as SETTINGS from 'constants/settings';
import { getChannelIdFromClaim, getChannelNameFromClaim } from 'util/claim';
import { selectAccountCheckIsFetchingForId, selectArweaveTipDataForId } from 'redux/selectors/stripe';
import { doArTip } from 'redux/actions/arwallet';
import { doToast } from 'redux/actions/notifications';
import { selectArweaveTippingErrorForId, selectArweaveTippingStartedForId } from 'redux/selectors/arwallet';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
const stripeEnvironment = getStripeEnvironment();
type SupportParams = {
  amount: number;
  claim_id: string;
  channel_id?: string;
};
type ArTipParams = {
  tipAmountTwoPlaces: number;
  tipChannelName: string;
  channelClaimId: string;
  recipientAddress: string;
  currency: string;
};
type UserParams = {
  activeChannelName: string | null | undefined;
  activeChannelId: string | null | undefined;
};
type Props = {
  uri: string;
  isSupport?: boolean;
  isTipOnly?: boolean;
  hasSelectedTab?: string;
  customText?: string;
  setAmount?: (arg0: number, arg1: string) => void;
  modalProps?: any;
};
export default function WalletSendTip(props: Props) {
  const { uri, isTipOnly, hasSelectedTab, customText, setAmount, modalProps } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri, false));
  const { claim_id: claimId, value_type: claimType } = claim || {};
  const channelClaimId = getChannelIdFromClaim(claim);
  const tipChannelName = getChannelNameFromClaim(claim);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const { name: activeChannelName, claim_id: activeChannelId } = activeChannelClaim || {};
  const tipData = useAppSelector((state) => selectArweaveTipDataForId(state, channelClaimId));
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;
  const balance = useAppSelector(selectBalance);
  const claimIsMine = useAppSelector((state) => selectClaimIsMineForUri(state, uri));
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const incognito = useAppSelector(selectIncognito);
  const instantTipEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED));
  const instantTipMax = useAppSelector((state) => selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX));
  const isPending = useAppSelector(selectIsSendingSupport);
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  const arweaveTipData = useAppSelector((state) => selectArweaveTipDataForId(state, channelClaimId));
  const isArweaveTipping = useAppSelector((state) => selectArweaveTippingStartedForId(state, claimId));
  const arweaveTippingError = useAppSelector((state) => selectArweaveTippingErrorForId(state, claimId));
  const checkingAccount = useAppSelector((state) => selectAccountCheckIsFetchingForId(state, claimId));

  const doHideModal_ = () => dispatch(doHideModal());
  const doSendTip_ = (...args: Parameters<typeof doSendTip>) => dispatch(doSendTip(...args));
  const doArTip_ = (...args: Parameters<typeof doArTip>) => dispatch(doArTip(...args));
  const doToast_ = (...args: Parameters<typeof doToast>) => dispatch(doToast(...args));
  const doTipAccountCheckForUri_ = (...args: Parameters<typeof doTipAccountCheckForUri>) =>
    dispatch(doTipAccountCheckForUri(...args));
  const { activeArStatus } = useArStatus();
  // const showStablecoin = ENABLE_STABLECOIN && experimentalUi;
  const showArweave = ENABLE_ARCONNECT;

  /** WHAT TAB TO SHOW **/
  // if it's your content, we show boost, otherwise default is LBC
  const defaultTabToShow = claimIsMine ? TAB_BOOST : TAB_USD;
  // loads the default tab if nothing else is there yet
  const [persistentTab, setPersistentTab] = usePersistedState('send-tip-modal', defaultTabToShow);
  const [activeTab, setActiveTab] = React.useState(claimIsMine ? TAB_BOOST : persistentTab);
  const [hasSelected, setSelected] = React.useState(false);

  /** STATE **/
  // tipAmount: number 12.345, round later
  const [tipAmount, setTipAmount] = usePersistedState('comment-support:customTip', 1.0);
  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [tipError, setTipError] = React.useState();
  const [disableSubmitButton, setDisableSubmitButton] = React.useState();

  /** CONSTS **/
  const boostThisContentText = getBoostThisContentText();
  const boostYourContentText = getBoostYourContentText();
  const isSupport = claimIsMine || activeTab === TAB_BOOST;
  // text for modal header
  const titleText = isSupport
    ? claimIsMine
      ? boostYourContentText
      : boostThisContentText
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

    case TAB_USD:
      // explainerText = __('Show this creator your appreciation by sending a donation.');
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
      doSendTip_(supportParams, isSupport);
      doHideModal_();
    }
  }

  // when the form button is clicked
  function handleSubmit() {
    if (!tipAmount || !claimId) return;

    if (setAmount) {
      setAmount(tipAmount, activeTab);
      doHideModal_();
      return;
    }

    // send an instant tip (no need to go to an exchange first)
    if (instantTipEnabled && activeTab !== TAB_USD) {
      if (instantTipMax.currency === 'LBC') {
        sendSupportOrConfirm(instantTipMax.amount);
      } else {
        // Need to convert currency of instant purchase maximum before trying to send support
        Lbryio.getExchangeRates().then(({ LBC_USD }) => sendSupportOrConfirm(instantTipMax.amount / LBC_USD));
      } // sending fiat tip
    } else if (activeTab === TAB_USD) {
      if (!isOnConfirmationPage) {
        setConfirmationPage(true);
      } else {
        const arweaveTipAddress = arweaveTipData.address;
        const currencyToUse = activeTab === TAB_USD ? 'AR' : 'USD';
        const tipParams: ArTipParams = {
          tipAmountTwoPlaces: tipAmount,
          tipChannelName: tipChannelName || '',
          channelClaimId: channelClaimId || '',
          recipientAddress: arweaveTipAddress,
          currency: currencyToUse,
        };
        const userParams: UserParams = {
          activeChannelName,
          activeChannelId,
        };
        // hit backend to send tip
        doArTip_(tipParams, !activeChannelId || incognito, userParams, claimId, stripeEnvironment, currencyToUse)
          .then((r) => {
            if (r.error) {
              throw new Error(r.error);
            }

            doToast_({
              message: __('Tip sent!'),
            });
            doHideModal_();
          })
          .catch((e) => {
            console.error(e);
            doToast_({
              message: __('Tip failed to send.'),
              subMessage: e?.message || e,
              isError: true,
            });
            throw new Error(e?.message || e); // don't close yet: remove doHideModal()
          });
      }
    } else {
      sendSupportOrConfirm();
    }
  }

  function buildButtonText() {
    // build button text based on tab
    switch (activeTab) {
      case TAB_BOOST:
        return titleText;

      case TAB_USD:
        return __('Send a %amount% Tip', {
          amount: `${tipAmount} USD`,
        });

      default:
        return titleText;
    }
  }

  React.useEffect(() => {
    doTipAccountCheckForUri_(uri);
  }, [doTipAccountCheckForUri_, uri]);
  React.useEffect(() => {
    if (!hasSelected && hasSelectedTab) {
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
  const tabButtonProps = {
    isOnConfirmationPage,
    activeTab,
    setActiveTab,
  };
  return (
    <Form onSubmit={handleSubmit}>
      {/* if there is no LBC balance, show user frontend to get credits */}
      {/* if there is lbc, the main tip/boost gui with the 3 tabs at the top */}
      <Card
        title={titleText}
        className="modal--send-tip"
        subtitle={
          <>
            {!claimIsMine && (
              <div className="section">
                {showArweave && (
                  <TabSwitchButton icon={ICONS.USD} label={__('Tip')} name={TAB_USD} {...tabButtonProps} />
                )}

                {/* Boost tab button */}
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
                    {activeTab === TAB_USD ? (
                      <p>{`${ICONS.USD} $ ${(Math.round(tipAmount * 100) / 100).toFixed(2)}`}</p>
                    ) : (
                      <p>{`${(Math.round(tipAmount * 100) / 100).toFixed(2)} ${ICONS.LBC}`}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="section__actions">
                {activeTab === TAB_USD ? (
                  <>
                    <Button button="primary" label={__('Confirm')} onClick={handleSubmit} />
                  </>
                ) : (
                  <Button
                    autoFocus
                    onClick={handleSubmit}
                    button="primary"
                    disabled={isArweaveTipping}
                    label={arweaveTippingError ? __('Retry') : __('Confirm')} // only disable if tipping.
                  />
                )}
                <Button button="link" label={__('Cancel')} onClick={() => setConfirmationPage(false)} />
              </div>
              {arweaveTippingError && <div className={'error'}>{arweaveTippingError}</div>}
            </>
          ) : !(activeTab === TAB_BOOST && balance === 0) ? (
            <>
              {activeTab === TAB_USD && !canReceiveTips ? (
                <div className="monetization-disabled">
                  USD Monetization isn't available. It may not be set up yet or has been disabled by the creator.
                </div>
              ) : activeTab === TAB_USD && activeArStatus !== 'connected' ? (
                <WalletStatus />
              ) : (
                <>
                  <ChannelSelector />
                  <WalletTipAmountSelector
                    setTipError={setTipError}
                    tipError={tipError}
                    uri={uri}
                    activeTab={activeTab === TAB_USD ? TAB_USD : activeTab}
                    amount={tipAmount}
                    onChange={(amount) => setTipAmount(amount)}
                    setDisableSubmitButton={setDisableSubmitButton}
                    modalProps={modalProps}
                    exchangeRateOverride={undefined}
                  />
                  <div className="section__actions">
                    <Button
                      autoFocus
                      icon={isSupport ? ICONS.TRENDING : ICONS.SUPPORT}
                      button="primary"
                      type="submit"
                      disabled={
                        checkingAccount ||
                        fetchingChannels ||
                        isPending ||
                        tipError ||
                        !tipAmount ||
                        disableSubmitButton ||
                        (!canReceiveTips && activeTab === TAB_USD)
                      }
                      label={<LbcMessage>{customText || buildButtonText()}</LbcMessage>}
                    />
                    {fetchingChannels && <span className="help">{__('Loading your channels...')}</span>}
                  </div>
                </>
              )}
            </> // if it's LBC and there is no balance, you can prompt to purchase LBC
          ) : (
            <Card
              title={
                <I18nMessage
                  tokens={{
                    lbc: <LbcSymbol size={22} />,
                  }}
                >
                  Supporting content requires %lbc%
                </I18nMessage>
              }
              subtitle={
                <I18nMessage
                  tokens={{
                    lbc: <LbcSymbol />,
                  }}
                >
                  With %lbc%, you can send tips to your favorite creators, or help boost their content for more people
                  to see.
                </I18nMessage>
              }
              actions={
                <div className="section__actions">
                  <Button
                    icon={ICONS.REWARDS}
                    button="primary"
                    label={__('Receive Credits')}
                    navigate={`/$/${PAGES.REWARDS}`}
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
  icon: string;
  label: string;
  name: string;
  isOnConfirmationPage: boolean;
  activeTab: string;
  setActiveTab: (arg0: string) => void;
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
      className={classnames('button-toggle', {
        'button-toggle--active': activeTab === name,
      })}
    />
  );
};
