// @flow
import React from 'react';

// $FlowFixMe
import { Global } from '@emotion/react';
import ClaimPreview from 'component/claimPreview';
import BusyIndicator from 'component/common/busy-indicator';
import { Form } from 'component/common/form';
import * as ICONS from 'constants/icons';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import Card from 'component/common/card';
import WalletStatus from 'component/walletStatus';
import { secondsToDhms } from 'util/time';
import Icon from 'component/common/icon';
import I18nMessage from 'component/i18nMessage';
import { ModalContext } from 'contexts/modal';
import { useArStatus } from 'effects/use-ar-status';
import './style.scss';

type RentalTagParams = { price: number, expirationTimeInSeconds: number };

// prettier-ignore
const STRINGS = {
  purchase: {
    title: 'Confirm Purchase',
    button: 'Purchase for %currency%%amount%',
  },
  preorder: {
    title: 'Confirm Pre-order',
    // subtitle: 'This content is not available yet but you can pre-order it now so you can access it as soon as it goes live.',
    button: 'Pre-order for %currency%%amount%',
  },
  rental: {
    title: 'Confirm Rental',
    button: 'Rent %duration% for %currency%%amount%',
  },
  purchaseOrRent: {
    title: 'Confirm Purchase/Rental',
    button: 'Purchase for %currency%%amount%',
  },
};

type Props = {
  uri: string,
  // -- redux --
  claimId: string,
  canReceiveTips: boolean,
  preferredCurrency: string,
  preorderTag: number,
  purchaseTag: ?number,
  rentalTag: RentalTagParams,
  balance: ArweaveBalance,
  exchangeRate: { ar: number },
  costInfo: any,
  fiatRequired: boolean,
  isFetchingPurchases: boolean,
  isAuthenticated: boolean,
  pendingSdkPayment: boolean,
  pendingPurchase: boolean,
  doHideModal: () => void,
  doPurchaseClaimForUri: (params: { uri: string, type: string }) => void,
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doPlayUri: (uri: string, skipCostCheck: boolean, saveFileOverride?: boolean, cb?: () => void) => void,
};

export default function PreorderAndPurchaseContentCard(props: Props) {
  const {
    uri,
    claimId,
    canReceiveTips,
    preferredCurrency,
    rentalTag,
    purchaseTag,
    preorderTag,
    balance,
    exchangeRate,
    costInfo,
    fiatRequired,
    isFetchingPurchases,
    isAuthenticated,
    pendingSdkPayment,
    pendingPurchase,
    doHideModal,
    doPurchaseClaimForUri,
    doCheckIfPurchasedClaimId,
    doPlayUri,
  } = props;

  const { ar: arBalance } = balance;
  const { ar: dollarsPerAr } = exchangeRate;

  const cantAffordPreorder = preorderTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < preorderTag);
  const cantAffordRent = rentalTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < rentalTag);
  const cantAffordPurchase = purchaseTag && (dollarsPerAr && Number(dollarsPerAr) * arBalance < purchaseTag);

  const { activeArStatus } = useArStatus();

  const isUrlParamModal = React.useContext(ModalContext).isUrlParamModal;

  const [waitingForBackend, setWaitingForBackend] = React.useState(false);
  const tags = { rentalTag, purchaseTag, preorderTag };

  let tipAmount = 0;
  let rentTipAmount = 0;

  if (tags.purchaseTag && tags.rentalTag) {
    tipAmount = tags.purchaseTag;
    rentTipAmount = tags.rentalTag.price;
  } else if (tags.purchaseTag) {
    tipAmount = tags.purchaseTag;
  } else if (tags.rentalTag) {
    tipAmount = tags.rentalTag.price;
  } else if (tags.preorderTag) {
    tipAmount = tags.preorderTag;
  }

  let transactionType = '';
  if (tags.purchaseTag && tags.rentalTag) {
    transactionType = 'purchaseOrRent';
  } else if (tags.purchaseTag || costInfo?.cost) {
    transactionType = 'purchase';
  } else if (tags.rentalTag) {
    transactionType = 'rental';
  } else {
    transactionType = 'preorder';
  }

  const rentDuration = tags?.rentalTag?.expirationTimeInSeconds
    ? secondsToDhms(tags.rentalTag.expirationTimeInSeconds)
    : '';

  const fiatSymbol = STRIPE.CURRENCY[preferredCurrency].symbol;

  function handleSubmit(forceRental) {
    // if it's both purchase/rent, use purchase, for rent we will force it
    if (transactionType === 'purchaseOrRent') {
      transactionType = 'purchase';
    }
    if (forceRental) transactionType = 'rental';

    async function checkIfFinished() {
      await doCheckIfPurchasedClaimId(claimId);
      doHideModal();
    }

    setWaitingForBackend(true);

    // $FlowFixMe
    doPurchaseClaimForUri({ uri, transactionType }).then(checkIfFinished);
  }

  React.useEffect(() => {
    // -- fetch for modal url param --
    if (isUrlParamModal && isAuthenticated && claimId && fiatRequired && isFetchingPurchases === undefined) {
      doCheckIfPurchasedClaimId(claimId);
    }
  }, [claimId, doCheckIfPurchasedClaimId, fiatRequired, isAuthenticated, isFetchingPurchases, isUrlParamModal]);

  React.useEffect(() => {
    // -- close modal when already purchased --
    if (isUrlParamModal && claimId && !pendingPurchase && (!fiatRequired || isFetchingPurchases === false)) {
      doHideModal();
    }
  }, [claimId, doHideModal, fiatRequired, isFetchingPurchases, isUrlParamModal, pendingPurchase]);

  if (isUrlParamModal && (!pendingPurchase || (pendingSdkPayment && costInfo === undefined))) {
    // -- hide modal until a pendingPurchase condition is found to show it --
    return <Global styles={{ '.ReactModalPortal': { display: 'none' } }} />;
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Card
        title={__(STRINGS[transactionType].title)}
        className="fiat-order"
        actions={
          <div className="fiat-order__actions">
            <div className="fiat-order__claim-preview">
              <ClaimPreview uri={uri} hideMenu hideActions nonClickable type="small" />
            </div>
            {/* confirm purchase - needs to check balance and disable */}
            {!canReceiveTips ? (
              <div className="monetization-disabled">
                USD Monetization isn't available. It may not be set up yet or has been disabled by the creator.
              </div>
            ) : activeArStatus !== 'connected' ? (
              <WalletStatus />
            ) : null}
            {waitingForBackend ? (
              <BusyIndicator message={__('Processing order...')} />
            ) : (
              <SubmitArea
                handleSubmit={handleSubmit}
                pendingSdkPayment={pendingSdkPayment}
                costInfo={costInfo}
                label={STRINGS[transactionType].button}
                fiatSymbol={fiatSymbol}
                tipAmount={tipAmount}
                tags={tags}
                rentLabel={STRINGS['rental'].button}
                rentTipAmount={rentTipAmount}
                rentDuration={rentDuration}
                disabled={activeArStatus !== 'connected' || !canReceiveTips}
                rentDisabled={cantAffordRent}
                purchaseDisabled={cantAffordPurchase}
                preorderDisabled={cantAffordPreorder}
                uri={uri}
                setWaitingForBackend={setWaitingForBackend}
                doPlayUri={doPlayUri}
                doHideModal={doHideModal}
              />
            )}
            <p className="help">
              <I18nMessage
                tokens={{
                  paid_content_terms_and_conditions: (
                    <Button
                      button="link"
                      href="https://help.odysee.tv/category-monetization/"
                      label={__('paid-content terms and conditions')}
                    />
                  ),
                }}
              >
                By continuing, you accept the %paid_content_terms_and_conditions%. All payments are final and
                non-refundable.
              </I18nMessage>
            </p>
          </div>
        }
      />
    </Form>
  );
}

const SubmitArea = (props: any) => (
  <div className="handle-submit-area">
    {props.pendingSdkPayment && (
      <Button
        button="primary"
        requiresAuth
        onClick={() => {
          props.setWaitingForBackend(true);
          props.doPlayUri(props.uri, true, undefined, props.doHideModal);
        }}
        label={
          <I18nMessage tokens={{ currency: <Icon icon={ICONS.LBC} />, amount: props.costInfo?.cost || '?' }}>
            Purchase for %currency%%amount%
          </I18nMessage>
        }
        icon={ICONS.BUY}
      />
    )}

    <Button
      button="primary"
      onClick={() => props.handleSubmit()}
      label={__(props.label, {
        currency: props.fiatSymbol,
        amount: props.tipAmount.toString(),
        duration: props.rentDuration,
      })}
      icon={props.tags.rentalTag ? ICONS.BUY : ICONS.TIME}
      disabled={props.disabled || props.purchaseDisabled}
    />

    {props.tags.purchaseTag && props.tags.rentalTag && (
      <Button
        button="primary"
        onClick={() => props.handleSubmit('rent')}
        label={__(props.rentLabel, {
          currency: props.fiatSymbol,
          amount: props.rentTipAmount.toString(),
          duration: props.rentDuration,
        })}
        icon={ICONS.TIME}
        disabled={props.disabled || props.rentDisabled}
      />
    )}
  </div>
);
