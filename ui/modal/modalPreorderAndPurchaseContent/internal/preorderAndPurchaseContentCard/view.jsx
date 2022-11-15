// @flow
import React from 'react';

import './style.scss';
import ClaimPreview from 'component/claimPreview';
import BusyIndicator from 'component/common/busy-indicator';
import { Form } from 'component/common/form';
import * as ICONS from 'constants/icons';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import Card from 'component/common/card';
import withCreditCard from 'hocs/withCreditCard';
import { secondsToDhms } from 'util/time';
import Icon from 'component/common/icon';
import I18nMessage from 'component/i18nMessage';

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
  preferredCurrency: string,
  preorderTag: number,
  purchaseTag: ?number,
  rentalTag: RentalTagParams,
  costInfo: any,
  doHideModal: () => void,
  doPurchaseClaimForUri: (params: { uri: string, type: string }) => void,
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doPlayUri: (params: { uri: string, collection: { collectionId: ?string } }) => void,
};

export default function PreorderAndPurchaseContentCard(props: Props) {
  const {
    uri,
    claimId,
    preferredCurrency,
    rentalTag,
    purchaseTag,
    preorderTag,
    costInfo,
    doHideModal,
    doPurchaseClaimForUri,
    doCheckIfPurchasedClaimId,
    doPlayUri,
  } = props;

  const [waitingForBackend, setWaitingForBackend] = React.useState(false);
  const tags = { rentalTag, purchaseTag, preorderTag };
  const sdkFeeRequired = costInfo && costInfo.cost > 0;

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

  let transactionType;
  if (tags.purchaseTag && tags.rentalTag) {
    transactionType = 'purchaseOrRent';
  } else if (tags.purchaseTag) {
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

    doPurchaseClaimForUri({ uri, transactionType }).then(checkIfFinished);
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

            {sdkFeeRequired ? (
              <Button
                button="primary"
                requiresAuth
                onClick={() => doPlayUri(uri, true, undefined, doHideModal)}
                label={
                  <I18nMessage tokens={{ currency: <Icon icon={ICONS.LBC} />, amount: costInfo.cost }}>
                    Purchase for %currency%%amount%
                  </I18nMessage>
                }
                icon={ICONS.BUY}
              />
            ) : waitingForBackend ? (
              <BusyIndicator message={__('Processing order...')} />
            ) : (
              <SubmitArea
                handleSubmit={handleSubmit}
                label={STRINGS[transactionType].button}
                fiatSymbol={fiatSymbol}
                tipAmount={tipAmount}
                tags={tags}
                rentLabel={STRINGS['rental'].button}
                rentTipAmount={rentTipAmount}
                rentDuration={rentDuration}
              />
            )}
          </div>
        }
      />
    </Form>
  );
}

const SubmitArea = withCreditCard((props: any) => (
  <div className="handle-submit-area">
    <Button
      button="primary"
      onClick={() => props.handleSubmit()}
      label={__(props.label, {
        currency: props.fiatSymbol,
        amount: props.tipAmount.toString(),
        duration: props.rentDuration,
      })}
      icon={props.tags.rentalTag ? ICONS.BUY : ICONS.TIME}
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
      />
    )}
  </div>
));
