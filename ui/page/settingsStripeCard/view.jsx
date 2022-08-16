// restore flow
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';

import { FormField } from 'component/common/form';
import { STRIPE_PUBLIC_KEY } from 'config';
import { getStripeEnvironment } from 'util/stripe';
import { Lbryio } from 'lbryinc';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';

import Page from 'component/page';
import Card from 'component/common/card';
import Plastic from 'react-plastic';
import Button from 'component/button';
import Spinner from 'component/spinner';

let stripeEnvironment = getStripeEnvironment();
const STRIPE_PLUGIN_SRC = 'https://js.stripe.com/v3/';

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
type Props = {
  email: ?string,
  preferredCurrency: string,
  customerStatusFetching: ?boolean,
  cardDetails: StripeCardDetails,
  doSetPreferredCurrency: (value: string) => void,
  doGetCustomerStatus: () => void,
  doToast: (params: { message: string }) => void,
  doOpenModal: (modalId: string, {}) => void,
  doRemoveCardForPaymentMethodId: (paymentMethodId: string) => void,
};

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
type State = {
  cardNameValue: string,
};

class SettingsStripeCard extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { cardNameValue: '' };
  }

  componentDidMount() {
    const { email, doGetCustomerStatus, doToast } = this.props;

    // only add script if it doesn't already exist
    const stripeScriptExists = document.querySelectorAll(`script[src="${STRIPE_PLUGIN_SRC}"]`).length > 0;

    if (!stripeScriptExists) {
      const script = document.createElement('script');
      script.src = STRIPE_PLUGIN_SRC;
      script.async = true;

      // $FlowFixMe
      document.body.appendChild(script);
    }

    // client secret of the SetupIntent (don't share with anyone but customer)
    let clientSecret = '';

    // setting a timeout to let the client secret populate
    // TODO: fix this, should be a cleaner way
    setTimeout(() => {
      doGetCustomerStatus()
        .then((customerStatusResponse) => {
          // get a payment method secret for frontend
          Lbryio.call('customer', 'setup', { environment: stripeEnvironment }, 'post').then((customerSetupResponse) => {
            clientSecret = customerSetupResponse.client_secret;

            // instantiate stripe elements
            setupStripe();
          });
        })
        .catch((error) => {
          // errorString passed from the API (with a 403 error)
          const errorString = 'user as customer is not setup yet';

          // if it's beamer's error indicating the account is not linked yet
          if (error.message && error.message.indexOf(errorString) > -1) {
            // get a payment method secret for frontend
            Lbryio.call('customer', 'setup', { environment: stripeEnvironment }, 'post').then(
              (customerSetupResponse) => {
                clientSecret = customerSetupResponse.client_secret;

                // instantiate stripe elements
                setupStripe();
              }
            );
            // 500 error from the backend being down
          } else if (error === 'internal_apis_down') {
            doToast({ message: STRIPE.APIS_DOWN_ERROR_RESPONSE, isError: true });
          } else {
            // probably an error from stripe
            doToast({ message: STRIPE.CARD_SETUP_ERROR_RESPONSE, isError: true });
          }
        });
    }, 250);

    function setupStripe() {
      // TODO: have to fix this, using so that the script is available
      setTimeout(() => {
        var stripeElements = (setupIntent) => {
          // eslint-disable-next-line no-undef
          var stripe = Stripe(STRIPE_PUBLIC_KEY);
          var elements = stripe.elements();

          // Element styles
          var style = {
            base: {
              fontSize: '16px',
              color: '#32325d',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
              fontSmoothing: 'antialiased',
              '::placeholder': {
                color: 'rgba(0,0,0,0.4)',
              },
            },
          };

          var card = elements.create('card', { style: style });

          card.mount('#card-element');

          // Element focus ring
          card.on('focus', () => {
            var el = document.getElementById('card-element');
            el.classList.add('focused');
          });

          card.on('blur', () => {
            var el = document.getElementById('card-element');
            el.classList.remove('focused');
          });

          card.on('ready', () => {
            // focus on the name input
            document.querySelector('#card-name').focus();
          });

          function submitForm(event) {
            event.preventDefault();

            const cardUserName = document.querySelector('#card-name').value;
            if (!cardUserName) {
              return (document.querySelector('.sr-field-error').innerHTML = __('Please enter the name on the card'));
            }

            // if client secret wasn't loaded properly
            if (!clientSecret) {
              var displayErrorText = 'There was an error in generating your payment method. Please contact a developer';
              var displayError = document.getElementById('card-errors');
              displayError.textContent = displayErrorText;

              return;
            }

            changeLoadingState(true);

            const name = document.querySelector('#card-name').value;

            stripe
              .confirmCardSetup(clientSecret, { payment_method: { card: card, billing_details: { email, name } } })
              .then((result) => {
                if (result.error) {
                  changeLoadingState(false);
                  var displayError = document.getElementById('card-errors');
                  displayError.textContent = result.error.message;
                } else {
                  // The PaymentMethod was successfully set up
                  // hide and show the proper divs
                  stripe.retrieveSetupIntent(clientSecret).then(doGetCustomerStatus);
                }
              });
          }

          // Handle payment submission when user clicks the pay button.
          var button = document.getElementById('submit');
          button.addEventListener('click', submitForm);

          // currently doesn't work because the iframe javascript context is different
          // would be nice though if it's even technically possible
          // window.addEventListener('keyup', function(event) {
          //   if (event.keyCode === 13) {
          //     submitForm(event);
          //   }
          // }, false);
        };

        // TODO: possible bug here where clientSecret isn't done
        stripeElements(STRIPE_PUBLIC_KEY, clientSecret);

        // Show a spinner on payment submission
        var changeLoadingState = (isLoading) => {
          if (isLoading) {
            // $FlowFixMe
            document.querySelector('button').disabled = true;
            // $FlowFixMe
            document.querySelector('#stripe-spinner').classList.remove('hidden');
            // $FlowFixMe
            document.querySelector('#button-text').classList.add('hidden');
          } else {
            // $FlowFixMe
            document.querySelector('button').disabled = false;
            // $FlowFixMe
            document.querySelector('#stripe-spinner').classList.add('hidden');
            // $FlowFixMe
            document.querySelector('#button-text').classList.remove('hidden');
          }
        };
      }, 0);
    }
  }

  render() {
    let that = this;
    const returnToValue = new URLSearchParams(location.search).get('returnTo');
    let shouldShowBackToMembershipButton = returnToValue === 'premium';

    function clearErrorMessage() {
      const errorElement = document.querySelector('.sr-field-error');

      errorElement.innerHTML = '';
    }

    function onChangeCardName(event) {
      const { value } = event.target;

      const numberOrSpecialCharacter = /[0-9!@#$%^&*()_+=[\]{};:"\\|,<>?~]/;

      const errorElement = document.querySelector('.sr-field-error');

      if (numberOrSpecialCharacter.test(value)) {
        errorElement.innerHTML = __('Special characters and numbers are not allowed');
      } else if (value.length > 48) {
        errorElement.innerHTML = __('Name must be less than 48 characters long');
      } else {
        errorElement.innerHTML = '';

        that.setState({ cardNameValue: value });
      }
    }

    const {
      preferredCurrency,
      customerStatusFetching,
      cardDetails,
      doOpenModal,
      doToast,
      doRemoveCardForPaymentMethodId,
      doSetPreferredCurrency,
    } = this.props;

    const { cardNameValue } = this.state;

    if (cardDetails) {
      return (
        <Page
          settingsPage
          noFooter
          noSideNavigation
          className="card-stack"
          backout={{ title: __('Your Card'), backLabel: __('Back') }}
        >
          <div className="successCard">
            {/* back to membership button */}
            {shouldShowBackToMembershipButton && (
              <Button
                button="primary"
                label={__('Back To Odysee Premium')}
                icon={ICONS.UPGRADE}
                navigate={`/$/${PAGES.ODYSEE_MEMBERSHIP}`}
                style={{ marginBottom: '20px' }}
              />
            )}
            <Card
              title={__('Card Details')}
              className="add-payment-card-div"
              body={
                <>
                  <Plastic
                    type={cardDetails.brand}
                    name={cardDetails.name}
                    expiry={cardDetails.expiryMonth + '/' + cardDetails.expiryYear}
                    number={'____________' + cardDetails.lastFour}
                  />
                  <br />
                  <Button
                    button="primary"
                    label={__('Remove Card')}
                    icon={ICONS.DELETE}
                    onClick={(e) =>
                      doOpenModal(MODALS.CONFIRM, {
                        title: __('Confirm Remove Card'),
                        subtitle: __('Remove the current card in your account?'),
                        onConfirm: (closeModal) =>
                          doRemoveCardForPaymentMethodId(cardDetails.paymentMethodId).then(() => {
                            doToast({ message: __('Succesfully removed Card.') });
                            closeModal();
                          }),
                      })
                    }
                  />
                  <Button
                    button="secondary"
                    label={__('View Transactions')}
                    icon={ICONS.SETTINGS}
                    navigate={`/$/${PAGES.WALLET}?fiatType=outgoing&tab=fiat-payment-history&currency=fiat`}
                    style={{ marginLeft: '10px' }}
                  />
                </>
              }
            />
            <br />

            <div className="currency-to-use-div">
              <h1 className="currency-to-use-header">{__('Currency To Use')}:</h1>

              <fieldset-section>
                <FormField
                  className="currency-to-use-selector"
                  name="currency_selector"
                  type="select"
                  onChange={(e) => doSetPreferredCurrency(e.target.value)}
                  value={preferredCurrency}
                >
                  {Object.values(STRIPE.CURRENCIES).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </FormField>
              </fieldset-section>
            </div>
          </div>
        </Page>
      );
    }

    if (cardDetails === null) {
      return (
        <Page
          settingsPage
          noFooter
          noSideNavigation
          className="card-stack"
          backout={{ title: __('Add Card'), backLabel: __('Back') }}
        >
          <div className="sr-root">
            <div className="sr-main">
              <div className="">
                <div className="sr-form-row">
                  <label className="payment-details">{__('Name on card')}</label>
                  <input
                    type="text"
                    id="card-name"
                    onChange={onChangeCardName}
                    value={cardNameValue}
                    onBlur={clearErrorMessage}
                  />
                </div>
                <div className="sr-form-row">
                  <label className="payment-details">{__('Card details')}</label>
                  <div className="sr-input sr-element sr-card-element" id="card-element" />
                </div>
                <div className="sr-field-error" id="card-errors" role="alert" />
                <button className="linkButton" id="submit">
                  <div className="stripe__spinner hidden" id="stripe-spinner" />
                  <span id="button-text">{__('Add Card')}</span>
                </button>
              </div>
            </div>
          </div>
        </Page>
      );
    }

    return (
      <Page
        settingsPage
        noFooter
        noSideNavigation
        className="card-stack"
        backout={{ title: __('Your Card'), backLabel: __('Back') }}
      >
        {customerStatusFetching && (
          <div className="main--empty">
            <Spinner text={__('Getting your card connection status...')} />
          </div>
        )}
      </Page>
    );
  }
}

export default SettingsStripeCard;
/* eslint-enable no-undef */
/* eslint-enable react/prop-types */
