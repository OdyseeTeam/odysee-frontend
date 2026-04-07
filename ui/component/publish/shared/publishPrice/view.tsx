import React from 'react';
import classnames from 'classnames';
import FeeBreakdown from './internal/feeBreakdown';
import Button from 'component/button';
import { FormField, FormFieldPrice } from 'component/common/form';
import Card from 'component/common/card';
import LbcSymbol from 'component/common/lbc-symbol';
import FormFieldDurationCombo from 'component/formFieldDurationCombo';
import I18nMessage from 'component/i18nMessage';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { PAYWALL } from 'constants/publish';
import { ENABLE_ARCONNECT } from 'config';
import './style.lazy.scss';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import {
  doCustomerPurchaseCost as doCustomerPurchaseCostAction,
  doTipAccountStatus as doTipAccountStatusAction,
} from 'redux/actions/payments';
import { selectAccountChargesEnabled, selectArweaveDefaultAccountMonetizationEnabled } from 'redux/selectors/payments';
const FEE = {
  MIN: 0,
  MAX: 999.99,
};
const CURRENCY_OPTIONS = ['USD']; // ['USD', 'EUR']; // disable EUR until currency approach is determined.

type Props = {
  disabled: boolean;
};

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
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

function PublishPrice(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
  const paywall = useAppSelector((state) => selectPublishFormValue(state, 'paywall')) || PAYWALL.FREE;
  const fiatPurchaseEnabled = useAppSelector((state) => selectPublishFormValue(state, 'fiatPurchaseEnabled'));
  const fiatPurchaseFee = useAppSelector((state) => selectPublishFormValue(state, 'fiatPurchaseFee'));
  const fiatRentalEnabled = useAppSelector((state) => selectPublishFormValue(state, 'fiatRentalEnabled'));
  const fiatRentalFee = useAppSelector((state) => selectPublishFormValue(state, 'fiatRentalFee'));
  const fiatRentalExpiration = useAppSelector((state) => selectPublishFormValue(state, 'fiatRentalExpiration'));
  const fee = useAppSelector((state) => selectPublishFormValue(state, 'fee'));
  const chargesEnabled = useAppSelector((state) => selectAccountChargesEnabled(state));
  const memberRestrictionOn = useAppSelector((state) => selectPublishFormValue(state, 'memberRestrictionOn'));
  const visibility = useAppSelector((state) => selectPublishFormValue(state, 'visibility'));
  const monetizationStatus = useAppSelector((state) => selectArweaveDefaultAccountMonetizationEnabled(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const doTipAccountStatus = () => dispatch(doTipAccountStatusAction());
  const doCustomerPurchaseCost = (cost: number) => dispatch(doCustomerPurchaseCostAction(cost));
  const expanded = true;
  const [hadSDKPaywallSelected] = React.useState(paywall === PAYWALL.SDK);
  const paymentDisallowed = visibility !== 'public';
  const bankAccountNotFetched = chargesEnabled === undefined;
  const noBankAccount = !chargesEnabled && !bankAccountNotFetched;
  // If it's only restricted, the price can be added externally, and they won't be able to change it
  const restrictedWithoutPrice = paywall === PAYWALL.FREE && memberRestrictionOn;

  function sanitizeFee(name) {
    const feeLookup = {
      fiatPurchaseFee: fiatPurchaseFee,
      fiatRentalFee: fiatRentalFee,
    };
    const f = feeLookup[name];

    if (f && Number.isFinite(f.amount)) {
      updatePublishForm({
        [name]: { ...f, amount: clamp(f.amount.toFixed(2), FEE.MIN, FEE.MAX) },
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
      <div className="publish-price__row">
        <div className="publish-price__grp-1">
          <fieldset-section>
            <FormField
              type="checkbox"
              name="content_paid"
              label={__('Enable paid content (Purchase / Rent)')}
              checked={paywall === PAYWALL.FIAT}
              disabled={disabled || !monetizationStatus || restrictedWithoutPrice}
              onChange={() => updatePublishForm({ paywall: paywall === PAYWALL.FIAT ? PAYWALL.FREE : PAYWALL.FIAT })}
              helper={
                !monetizationStatus &&
                'In order to use this feature, you must set up a wallet and enable monetization first.'
              }
            />
            {hadSDKPaywallSelected && (
              <>
                <FormField
                  type="radio"
                  name="content_sdk"
                  label={<LbcSymbol prefix={__('Purchase with Credits')} />}
                  checked={paywall === PAYWALL.SDK}
                  disabled={disabled}
                  onChange={() => updatePublishForm({ paywall: PAYWALL.SDK })}
                />
                {paywall === PAYWALL.SDK && (
                  <p className="help--warning" style={{ marginTop: '10px' }}>
                    LBC will be sunset in the future, we recommend using other content pricing methods
                  </p>
                )}
              </>
            )}
          </fieldset-section>
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
            onChange={() =>
              updatePublishForm({
                fiatPurchaseEnabled: !fiatPurchaseEnabled,
              })
            }
          />
        </div>
        <div
          className={classnames('publish-price__grp-2', {
            'publish-price__grp-2--disabled': !fiatPurchaseEnabled,
          })}
        >
          <FormFieldPrice
            name="fiat_purchase_fee"
            min={0.01}
            price={fiatPurchaseFee}
            onChange={(fee) =>
              updatePublishForm({
                fiatPurchaseFee: fee,
              })
            }
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
            onChange={() =>
              updatePublishForm({
                fiatRentalEnabled: !fiatRentalEnabled,
              })
            }
          />
        </div>
        <div
          className={classnames('publish-price__grp-2', {
            'publish-price__grp-2--disabled': !fiatRentalEnabled,
          })}
        >
          <FormFieldPrice
            name="fiat_rental_fee"
            min={0.01}
            price={fiatRentalFee}
            onChange={(fee) =>
              updatePublishForm({
                fiatRentalFee: fee,
              })
            }
            onBlur={() => sanitizeFee('fiatRentalFee')}
            currencies={CURRENCY_OPTIONS}
          />
          <FormFieldDurationCombo
            label={__('Duration')}
            name="fiat_rental_expiration"
            min={1}
            duration={fiatRentalExpiration}
            onChange={(duration) =>
              updatePublishForm({
                fiatRentalExpiration: duration,
              })
            }
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
            onChange={(newFee) =>
              updatePublishForm({
                fee: newFee,
              })
            }
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
      dispatch(doTipAccountStatusAction());
    }
  }, [bankAccountNotFetched, dispatch]);

  const isPaid = paywall === PAYWALL.FIAT || paywall === PAYWALL.SDK;

  if (paymentDisallowed) {
    return (
      <div className="publish-price">
        <h3 className="publish-details__title">{__('Price')}</h3>
        <p className="publish-price__reason">
          {__('Payment options are not available for Unlisted or Scheduled content.')}
        </p>
      </div>
    );
  }

  return (
    <div className="publish-price">
      <h3 className="publish-details__title">{__('Price')}</h3>

      {restrictedWithoutPrice && getRestrictionWarningRow()}

      <FormField
        type="checkbox"
        name="content_paid"
        label={__('Enable paid content (Purchase / Rent)')}
        checked={isPaid}
        disabled={disabled || !monetizationStatus || restrictedWithoutPrice}
        onChange={() => {
          if (isPaid) {
            updatePublishForm({ paywall: PAYWALL.FREE, fiatPurchaseEnabled: false, fiatRentalEnabled: false });
          } else {
            updatePublishForm({ paywall: PAYWALL.FIAT });
          }
        }}
      />

      <div className="publish-price__options">
        <button
          type="button"
          className={
            'publish-price__option' +
            (!fiatPurchaseEnabled && !fiatRentalEnabled ? ' publish-price__option--selected' : '')
          }
          onClick={() => updatePublishForm({ paywall: PAYWALL.FREE })}
        >
          <div className="publish-price__option-header">
            <Icon icon={ICONS.UNLOCK} size={18} />
            <span>{__('Free')}</span>
          </div>
          <p className="publish-price__option-desc">{__('Anyone can view this content.')}</p>
        </button>

        <div
          className={
            'publish-price__option' +
            (isPaid && fiatPurchaseEnabled ? ' publish-price__option--selected' : '') +
            (!isPaid ? ' publish-price__option--disabled' : '')
          }
          onClick={() => {
            if (!isPaid) return;
            const next = !fiatPurchaseEnabled;
            const updates: any = { paywall: PAYWALL.FIAT, fiatPurchaseEnabled: next };
            if (!next && !fiatRentalEnabled) updates.paywall = PAYWALL.FREE;
            updatePublishForm(updates);
          }}
        >
          <div className="publish-price__option-header">
            <FormField
              type="checkbox"
              name="purchase_toggle"
              checked={fiatPurchaseEnabled}
              disabled={!isPaid}
              onChange={() => {
                updatePublishForm({ paywall: PAYWALL.FIAT, fiatPurchaseEnabled: !fiatPurchaseEnabled });
              }}
              label={__('Purchase')}
            />
          </div>
          <p className="publish-price__option-desc">{__('One-time purchase with USD.')}</p>
          {paywall === PAYWALL.FIAT && fiatPurchaseEnabled && (
            <div className="publish-price__option-content" onClick={(e) => e.stopPropagation()}>
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
          )}
        </div>

        <div
          className={
            'publish-price__option' +
            (isPaid && fiatRentalEnabled ? ' publish-price__option--selected' : '') +
            (!isPaid ? ' publish-price__option--disabled' : '')
          }
          onClick={() => {
            if (!isPaid) return;
            const next = !fiatRentalEnabled;
            const updates: any = { paywall: PAYWALL.FIAT, fiatRentalEnabled: next };
            if (!next && !fiatPurchaseEnabled) updates.paywall = PAYWALL.FREE;
            updatePublishForm(updates);
          }}
        >
          <div className="publish-price__option-header">
            <FormField
              type="checkbox"
              name="rental_toggle"
              checked={fiatRentalEnabled}
              disabled={!isPaid}
              onChange={() => {
                updatePublishForm({ paywall: PAYWALL.FIAT, fiatRentalEnabled: !fiatRentalEnabled });
              }}
              label={__('Rent')}
            />
          </div>
          <p className="publish-price__option-desc">{__('Rent for a limited time with USD.')}</p>
          {paywall === PAYWALL.FIAT && fiatRentalEnabled && (
            <div className="publish-price__option-content" onClick={(e) => e.stopPropagation()}>
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
          )}
        </div>
      </div>

      {(fiatPurchaseEnabled || fiatRentalEnabled) && getTncRow()}
    </div>
  );
}

export default PublishPrice;
