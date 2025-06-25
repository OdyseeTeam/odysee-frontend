// @flow
import React from 'react';
import classnames from 'classnames';
import FeeBreakdown from './internal/feeBreakdown';
import Button from 'component/button';
import { FormField, FormFieldPrice } from 'component/common/form';
import Card from 'component/common/card';
import LbcSymbol from 'component/common/lbc-symbol';
import FormFieldDurationCombo from 'component/formFieldDurationCombo';
import I18nMessage from 'component/i18nMessage';
import { PAYWALL } from 'constants/publish';
import * as PUBLISH_TYPES from 'constants/publish_types';
import usePersistedState from 'effects/use-persisted-state';
import { ENABLE_ARCONNECT } from 'config';
import './style.lazy.scss';

const FEE = { MIN: 0, MAX: 999.99 };
const CURRENCY_OPTIONS = ['USD']; // ['USD', 'EUR']; // disable EUR until currency approach is determined.

type Props = {
  disabled: boolean,
  // --- redux ---
  fileMime: ?string,
  streamType: ?string,
  fiatPurchaseEnabled: boolean,
  fiatPurchaseFee: Price,
  fiatRentalEnabled: boolean,
  fiatRentalFee: Price,
  fiatRentalExpiration: Duration,
  paywall: Paywall,
  fee: Fee,
  memberRestrictionStatus: MemberRestrictionStatus,
  chargesEnabled: ?boolean,
  monetizationStatus: boolean,
  updatePublishForm: (UpdatePublishState) => void,
  doTipAccountStatus: () => Promise<StripeAccountStatus>,
  doCustomerPurchaseCost: (cost: number) => Promise<StripeCustomerPurchaseCostResponse>,
  type: PublishType,
  visibility: Visibility,
  accountStatus: any,
};

function PublishPrice(props: Props) {
  const {
    fileMime,
    streamType,
    // Purchase
    fiatPurchaseEnabled,
    fiatPurchaseFee,
    // Rental
    fiatRentalEnabled,
    fiatRentalFee,
    fiatRentalExpiration,
    // SDK-LBC
    paywall = PAYWALL.FREE,
    fee,
    memberRestrictionStatus,
    chargesEnabled,
    monetizationStatus,
    updatePublishForm,
    doTipAccountStatus,
    doCustomerPurchaseCost,
    disabled,
    type,
    visibility,
    accountStatus,
  } = props;

  const [expanded, setExpanded] = usePersistedState('publish:price:extended', true);
  const [fiatAllowed, setFiatAllowed] = React.useState(true);
  const paymentDisallowed = visibility !== 'public';
  const bankAccountNotFetched = chargesEnabled === undefined;
  const noBankAccount = !chargesEnabled && !bankAccountNotFetched;

  // If it's only restricted, the price can be added externally, and they won't be able to change it
  const restrictedWithoutPrice = paywall === PAYWALL.FREE && memberRestrictionStatus.isRestricting;

  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value), min), max);
  }

  function sanitizeFee(name) {
    const feeLookup = {
      fiatPurchaseFee: fiatPurchaseFee,
      fiatRentalFee: fiatRentalFee,
    };

    const f = feeLookup[name];
    if (f && Number.isFinite(f.amount)) {
      updatePublishForm({
        [name]: {
          ...f,
          amount: clamp(f.amount.toFixed(2), FEE.MIN, FEE.MAX),
        },
      });
    }
  }

  function sanitizeDuration() {
    if (Number.isFinite(fiatRentalExpiration.value)) {
      updatePublishForm({
        fiatRentalExpiration: {
          ...fiatRentalExpiration,
          value: clamp(fiatRentalExpiration.value.toFixed(2), 1, 99999),
        },
      });
    }
  }

  function getRestrictionWarningRow() {
    return (
      <div className={classnames('publish-price__row', {})}>
        <div className="error__text">
          {__('You already have content restrictions enabled, disable them first in order to set a price.')}
        </div>
      </div>
    );
  }

  function getPaywallOptionsRow() {
    return (
      <div
        className={classnames('publish-price__row', {
          'publish-price__row--disabled': restrictedWithoutPrice,
        })}
      >
        <div className="publish-price__grp-1">
          <fieldset-section>
            <React.Fragment>
              <FormField
                type="radio"
                name="content_free"
                label={__('Free')}
                checked={paywall === PAYWALL.FREE}
                disabled={disabled}
                onChange={() => updatePublishForm({ paywall: PAYWALL.FREE })}
              />
              
              <FormField
                type="radio"
                name="content_fiat"
                label={`${__('Purchase / Rent')} \u{0024}`}
                checked={paywall === PAYWALL.FIAT}
                disabled={disabled || !monetizationStatus}
                onChange={() => updatePublishForm({ paywall: PAYWALL.FIAT })}
                helper={!monetizationStatus && 'In order to use this feature, you must set up a wallet and enable monetization first.'}
              />
              <FormField
                type="radio"
                name="content_sdk"
                label={<LbcSymbol prefix={__('Purchase with Credits')} />}
                checked={paywall === PAYWALL.SDK}
                disabled={disabled}
                onChange={() => updatePublishForm({ paywall: PAYWALL.SDK })}
              />
            </React.Fragment>
          </fieldset-section>
        </div>
      </div>
    );
  }

  function getTncRow() {
    return (
      <div className="publish-price__row">
        <div className="publish-price__grp-1 publish-price__tnc">
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
            By continuing, you accept the %paid_content_terms_and_conditions%.
          </I18nMessage>
        </div>
      </div>
    );
  }

  function getPurchaseRow() {
    return (
      <div
        className={classnames('publish-price__row', {
          'publish-price__row--disabled': (noBankAccount || restrictedWithoutPrice) && !ENABLE_ARCONNECT,
        })}
      >
        <div className="publish-price__grp-1">
          <FormField
            label={__('Purchase')}
            name="purchase"
            type="checkbox"
            checked={fiatPurchaseEnabled}
            onChange={() => updatePublishForm({ fiatPurchaseEnabled: !fiatPurchaseEnabled })}
          />
        </div>
        <div className={classnames('publish-price__grp-2', { 'publish-price__grp-2--disabled': !fiatPurchaseEnabled })}>
          <FormFieldPrice
            name="fiat_purchase_fee"
            min={0.01}
            price={fiatPurchaseFee}
            onChange={(fee) => updatePublishForm({ fiatPurchaseFee: fee })}
            onBlur={() => sanitizeFee('fiatPurchaseFee')}
            currencies={CURRENCY_OPTIONS}
          />
          <div className="publish-price__fees">
            <FeeBreakdown
              amount={fiatPurchaseFee.amount}
              currency={fiatPurchaseFee.currency}
              doCustomerPurchaseCost={doCustomerPurchaseCost}
            />
          </div>
        </div>
      </div>
    );
  }

  function getRentalRow() {
    return (
      <div
        className={classnames('publish-price__row', {
          'publish-price__row--disabled': (noBankAccount || restrictedWithoutPrice) && !ENABLE_ARCONNECT,
        })}
      >
        <div className="publish-price__grp-1">
          <FormField
            label={__('Rent')}
            name="rent"
            type="checkbox"
            checked={fiatRentalEnabled}
            onChange={() => updatePublishForm({ fiatRentalEnabled: !fiatRentalEnabled })}
          />
        </div>
        <div className={classnames('publish-price__grp-2', { 'publish-price__grp-2--disabled': !fiatRentalEnabled })}>
          <FormFieldPrice
            name="fiat_rental_fee"
            min={0.01}
            price={fiatRentalFee}
            onChange={(fee) => updatePublishForm({ fiatRentalFee: fee })}
            onBlur={() => sanitizeFee('fiatRentalFee')}
            currencies={CURRENCY_OPTIONS}
          />
          <FormFieldDurationCombo
            label={__('Duration')}
            name="fiat_rental_expiration"
            min={1}
            duration={fiatRentalExpiration}
            onChange={(duration) => updatePublishForm({ fiatRentalExpiration: duration })}
            onBlur={() => sanitizeDuration()}
            units={['months', 'weeks', 'days', 'hours']}
          />
          <div className="publish-price__fees">
            <FeeBreakdown
              amount={fiatRentalFee.amount}
              currency={fiatRentalFee.currency}
              doCustomerPurchaseCost={doCustomerPurchaseCost}
            />
          </div>
        </div>
      </div>
    );
  }

  function getLbcPurchaseRow() {
    return (
      <div
        className={classnames('publish-price__row', {
          'publish-price__row--disabled': restrictedWithoutPrice,
        })}
      >
        <div className="publish-price__grp-1">
          <FormFieldPrice
            name="lbc_purchase_fee"
            min={1}
            price={fee}
            onChange={(newFee) => updatePublishForm({ fee: newFee })}
          />
          {fee && fee.currency !== 'LBC' && (
            <p className="publish-price__subtitle">{__('All content fees are charged in Credits.')}</p>
          )}
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    if (bankAccountNotFetched) {
      doTipAccountStatus();
    }
  }, [bankAccountNotFetched, doTipAccountStatus]);

  React.useEffect(() => {
    function isFiatWhitelistedFileType() {
      if (fileMime) {
        // fileMime: the current browsed/selected file (it's empty on edit, but can be changed)
        return fileMime.startsWith('audio') || fileMime.startsWith('video');
      } else if (streamType) {
        // streamType: the original type that we are editing from.
        return streamType === 'audio' || streamType === 'video' || streamType === 'document';
      }
      return false;
    }

    const isFiatAllowed = type === PUBLISH_TYPES.POST || isFiatWhitelistedFileType();
    setFiatAllowed(isFiatAllowed);

    /*
    if (paywall === PAYWALL.FIAT && !isFiatAllowed) {
      updatePublishForm({ paywall: PAYWALL.FREE });
    }
    */
  }, [fileMime, paywall, type, updatePublishForm, streamType]);

  if (paymentDisallowed) {
    return (
      <div className="publish-price">
        <Card
          background
          isBodyList
          className="card--enable-overflows"
          title={__('Price')}
          body={
            <div className="publish-price__reason">
              {__('Payment options are not available for Unlisted or Scheduled content.')}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="publish-price">
      <Card
        background
        isBodyList
        className="card--enable-overflows"
        title={__('Price')}
        body={
          <>
            {expanded && (
              <div
                className={classnames('settings-row', {
                  'settings-row--disabled': paymentDisallowed,
                })}
              >
                {restrictedWithoutPrice && getRestrictionWarningRow()}
                {getPaywallOptionsRow()}
                {paywall === PAYWALL.FIAT && (
                  <div className="publish-price__group">
                    {getPurchaseRow()}
                    {getRentalRow()}
                    {getTncRow()}
                  </div>
                )}
                {paywall === PAYWALL.SDK && <div className="publish-price__group">{getLbcPurchaseRow()}</div>}
              </div>
            )}
            <div className="publish-row publish-row--more">
              <Button
                label={__(expanded ? 'Hide' : 'Show')}
                button="link"
                onClick={() => setExpanded((prev) => !prev)}
              />
            </div>
          </>
        }
      />
    </div>
  );
}

export default PublishPrice;
