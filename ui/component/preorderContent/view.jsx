// @flow
import { Form } from 'component/common/form';
import LbcMessage from 'component/common/lbc-message';
import { Lbryio } from 'lbryinc';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
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
};

export default function WalletSendTip(props: Props) {
  const {
    activeChannelId,
    activeChannelName,
    balance,
    claimId,
    channelClaimId,
    tipChannelName,
    claimIsMine,
    fetchingChannels,
    incognito,
    isPending,
    title,
    uri,
    hasSelectedTab,
    doHideModal,
    doSendCashTip,
    preferredCurrency,
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
  const isSupport = claimIsMine || activeTab === TAB_BOOST;

  // text for modal header
  const titleText = "Preorder Your Content"

  let channelName;
  try {
    ({ channelName } = parseURI(uri));
  } catch (e) {}

  // icon to use or explainer text to show per tab
  let explainerText = 'This content is not available yet but you' +
    ' can pre-order it now so you can access it as soon as it goes live.'

  // when the form button is clicked
  function handleSubmit() {
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

  function buildButtonText() {
    return 'Preorder your content for $14.95';
  }

  React.useEffect(() => {
    if (!hasSelected && hasSelectedTab && activeTab !== hasSelectedTab) {
      setActiveTab(hasSelectedTab);
      setSelected(true);
    }
  }, [activeTab, hasSelected, hasSelectedTab, setActiveTab]);

  React.useEffect(() => {
    if (!hasSelectedTab && activeTab !== hasSelectedTab) {
      setPersistentTab(activeTab);
    }
  }, [activeTab, hasSelectedTab, setPersistentTab]);

  /** RENDER **/
  let fiatSymbolToUse = '$';

  return (
    <Form onSubmit={handleSubmit}>
      {/* if there is no LBC balance, show user frontend to get credits */}
      {/* if there is lbc, the main tip/boost gui with the 3 tabs at the top */}
      <Card
        title={titleText}
        className={'preorder-content-modal'}
        subtitle={
          <>
            {/* short explainer under the button */}
            <div className="section__subtitle">
              {explainerText}
            </div>
          </>
        }
        actions={
          // confirmation modal, allow  user to confirm or cancel transaction
          isOnConfirmationPage ? (
            <>
              <div className="section section--padded card--inline confirm__wrapper">
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
                <Button autoFocus onClick={handleSubmit} button="primary" disabled={isPending} label={__('Confirm')} />
                <Button button="link" label={__('Cancel')} onClick={() => setConfirmationPage(false)} />
              </div>
            </>
          ) : !((activeTab === TAB_LBC || activeTab === TAB_BOOST) && balance === 0) ? (
            <>
              {/*<ChannelSelector />*/}

              {/* send tip/boost button */}
              <div className="section__actions">

                <Button
                  autoFocus
                  onClick={handleSubmit}
                  button="primary"
                  // label={__('Confirm')}
                  label={buildButtonText()}
                />

                {/*<Button*/}
                {/*  autoFocus*/}
                {/*  icon={ICONS.FINANCE}*/}
                {/*  button="primary"*/}
                {/*  type="submit"*/}
                {/*  disabled={fetchingChannels || isPending || tipError || !tipAmount || disableSubmitButton}*/}
                {/*  label={buildButtonText()}*/}
                {/*/>*/}
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
