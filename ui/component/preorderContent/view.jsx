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
import { preOrderPurchase } from '../../redux/actions/wallet';
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
    preOrderPurchase,
    preferredCurrency,
    preorderTag,
    doSendCashTip,
    checkIfAlreadyPurchased
  } = props;

  React.useEffect(() => {
    setTipAmount(preorderTag);
  }, [preorderTag])

  // loads the default tab if nothing else is there yet
  const [persistentTab, setPersistentTab] = usePersistedState('send-tip-modal', TAB_FIAT);
  const [activeTab, setActiveTab] = React.useState(persistentTab);
  const [hasSelected, setSelected] = React.useState(false);

  /** STATE **/
  const [tipAmount, setTipAmount] = React.useState();
  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [tipError, setTipError] = React.useState();
  const [disableSubmitButton, setDisableSubmitButton] = React.useState();

  const [waitingForBackend, setWaitingForBackend] = React.useState(false);

  const [hasCardSaved, setHasSavedCard] = React.useState(true);


  // check if user has a payment method saved
  React.useEffect(() => {
    if (!stripeEnvironment) return;

    Lbryio.call(
      'customer',
      'status',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((customerStatusResponse) => {
      const defaultPaymentMethodId =
        customerStatusResponse.Customer &&
        customerStatusResponse.Customer.invoice_settings &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method.id;

      setHasSavedCard(Boolean(defaultPaymentMethodId));
    });
  }, [setHasSavedCard]);


  // text for modal header
  const titleText = "Preorder Your Content"

  let channelName;
  try {
    ({ channelName } = parseURI(uri));
  } catch (e) {}

  // icon to use or explainer text to show per tab
  let explainerText = 'This content is not available yet but you' +
    ' can pre-order it now so you can access it as soon as it goes live'

  // when the form button is clicked
  function handleSubmit() {
    const tipParams: TipParams = {
      tipAmount,
      tipChannelName: tipChannelName || '',
      channelClaimId: channelClaimId || '',
    };
    const userParams: UserParams = { activeChannelName, activeChannelId };

    async function checkIfFinished(){
      await checkIfAlreadyPurchased();
      doHideModal()
    }

    setWaitingForBackend(true);

    // hit backend to send tip
    preOrderPurchase(
      tipParams,
      !activeChannelId || incognito,
      userParams,
      claimId,
      stripeEnvironment,
      preferredCurrency,
      checkIfFinished,
      doHideModal,
    );
  }

  function buildButtonText() {
    return `Preorder your content for $${tipAmount}`;
  }

  return (
    <Form onSubmit={handleSubmit}>
      {!waitingForBackend && <Card
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
          <>
            {/* send tip/boost button */}
            <div className="section__actions">

              <Button
                autoFocus
                onClick={handleSubmit}
                button="primary"
                // label={__('Confirm')}
                label={buildButtonText()}
                disabled={!hasCardSaved}
              />

              {!hasCardSaved && (<>
                <div className="add-card-prompt">
                  <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
                  {' ' + __('To Preorder Content')}
                </div>
              </>)}
            </div>
          </>
        }
      />}
      {waitingForBackend && <Card
        title={titleText}
        className={'preorder-content-modal-loading'}
        subtitle={
          <>
            {/* short explainer under the button */}
            <div className="section__subtitle">
              {'Processing your purchase...'}
            </div>
          </>
        }
      />}
    </Form>
  );
}
