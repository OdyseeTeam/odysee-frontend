// @flow
import { doToast } from 'redux/actions/notifications';
import { Lbryio } from 'lbryinc';
import { URL, WEBPACK_WEB_PORT } from 'config';
import { selectChannelIdForUri, selectChannelNameForUri } from 'redux/selectors/claims';
import * as ACTIONS from 'constants/action_types';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const isDev = process.env.NODE_ENV !== 'production';

let successStripeRedirectUrl, failureStripeRedirectUrl;
const SUCCESS_ENDPOINT = '/$/settings/tip_account';
const FAILURE_ENDPOINT = '/$/settings/tip_account';
if (isDev) {
  successStripeRedirectUrl = 'http://localhost:' + WEBPACK_WEB_PORT + SUCCESS_ENDPOINT;
  failureStripeRedirectUrl = 'http://localhost:' + WEBPACK_WEB_PORT + FAILURE_ENDPOINT;
} else {
  successStripeRedirectUrl = URL + SUCCESS_ENDPOINT;
  failureStripeRedirectUrl = URL + FAILURE_ENDPOINT;
}

// const APIS_DOWN_ERROR_RESPONSE = __('There was an error from the server, please try again later');
// const CARD_SETUP_ERROR_RESPONSE = __('There was an error getting your card setup, please try again later');

export function doTipAccountCheckForUri(uri: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const channelClaimId = selectChannelIdForUri(state, uri);
    const channelName = selectChannelNameForUri(state, uri);

    Lbryio.call(
      'account',
      'check',
      {
        channel_claim_id: channelClaimId,
        channel_name: channelName,
        environment: stripeEnvironment,
      },
      'post'
    ).then((accountCheckResponse) => {
      if (accountCheckResponse === true) {
        dispatch({
          type: ACTIONS.SET_CAN_RECEIVE_FIAT_TIPS,
          data: channelClaimId,
        });
      }
    });
  };
}

export function doTipAccountStatus(params: { getBank?: boolean, getTotals?: boolean, getInfo?: boolean }) {
  return (dispatch: Dispatch) => {
    Lbryio.call(
      'account',
      'status',
      {
        environment: stripeEnvironment,
      },
      'post'
    )
      .then((accountStatusResponse) => {
        const { getBank, getTotals, getInfo } = params;
        const { charges_enabled, total_received_unpaid, total_paid_out, account_info } = accountStatusResponse;

        if (getBank && charges_enabled) {
          dispatch({ type: ACTIONS.SET_BANK_ACCOUNT_CONFIRMED });
        }

        if (getTotals && total_received_unpaid && total_paid_out) {
          dispatch({
            type: ACTIONS.SET_STRIPE_ACCOUNT_TOTALS,
            data: { total_received_unpaid, total_paid_out },
          });
        }

        if (getInfo) {
          if (total_received_unpaid) {
            doAccountTransactions();
          }

          // if charges already enabled, no need to generate an account link
          if (charges_enabled) {
            // account has already been confirmed

            const eventuallyDueInformation = account_info.requirements.eventually_due;

            const currentlyDueInformation = account_info.requirements.currently_due;

            let accountStatusObj = {
              accountConfirmed: true,
              stillRequiringVerification: false,
            };

            if (
              (eventuallyDueInformation && eventuallyDueInformation.length) ||
              (currentlyDueInformation && currentlyDueInformation.length)
            ) {
              accountStatusObj.stillRequiringVerification = true;
              dispatch(getAndSetAccountLink(false));
            }

            dispatch({
              type: ACTIONS.SET_ACCOUNT_STATUS_FINISHED,
              data: accountStatusObj,
            });

            // user has not confirmed an account but have received payments
          } else if (total_received_unpaid > 0) {
            dispatch({ type: ACTIONS.SET_ACCOUNT_NOT_CONFIRMED_BUT_RECEIVED_TIPS });

            dispatch(getAndSetAccountLink());

            // user has not received any amount or confirmed an account
          } else {
            // get stripe link and set it on the frontend
            // pass true so it updates the frontend
            dispatch(getAndSetAccountLink(true));
          }
        }
      })
      .catch((error) => {
        const { getInfo } = params;

        if (getInfo) {
          // errorString passed from the API (with a 403 error)
          const errorString = 'account not linked to user, please link first';

          // if it's beamer's error indicating the account is not linked yet
          if (error.message.indexOf(errorString) > -1) {
            // get stripe link and set it on the frontend
            dispatch(getAndSetAccountLink(true));
          } else {
            // probably an error from stripe
            const displayString = __('There was an error getting your account setup, please try again later');
            dispatch(doToast({ message: displayString, isError: true }));
            // not an error from Beamer, throw it
            throw new Error(error);
          }
        }
      });
  };
}

export function doPaymentHistory() {
  return (dispatch: Dispatch) => {
    Lbryio.call(
      'customer',
      'list',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((customerTransactionResponse: any) => {
      // reverse so order is from most recent to latest
      if (customerTransactionResponse && customerTransactionResponse.length) {
        customerTransactionResponse.reverse();
      }

      // TODO: remove this once pagination is implemented
      if (
        customerTransactionResponse &&
        customerTransactionResponse.length &&
        customerTransactionResponse.length > 100
      ) {
        customerTransactionResponse.length = 100;
      }

      dispatch({
        type: ACTIONS.SET_ACCOUNT_PAYMENT_HISTORY,
        data: customerTransactionResponse,
      });
    });
  };
}

export function doAccountTransactions() {
  return (dispatch: Dispatch) => {
    Lbryio.call(
      'account',
      'list',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((accountListResponse: any) => {
      // reverse so order is from most recent to latest
      if (accountListResponse && accountListResponse.length) {
        accountListResponse.reverse();
      }

      // TODO: remove this once pagination is implemented
      if (accountListResponse && accountListResponse.length && accountListResponse.length > 100) {
        accountListResponse.length = 100;
      }

      dispatch({
        type: ACTIONS.SET_ACCOUNT_TRANSACTIONS,
        data: accountListResponse,
      });
    });
  };
}

function getAndSetAccountLink(stillNeedToConfirmAccount) {
  return (dispatch: Dispatch) => {
    Lbryio.call(
      'account',
      'link',
      {
        return_url: successStripeRedirectUrl,
        refresh_url: failureStripeRedirectUrl,
        environment: stripeEnvironment,
      },
      'post'
    ).then((accountLinkResponse) => {
      // stripe link for user to navigate to and confirm account
      const stripeConnectionUrl = accountLinkResponse.url;

      // set connection url on frontend
      dispatch({
        type: ACTIONS.SET_STRIPE_CONNECTION_URL,
        data: stripeConnectionUrl,
      });

      // show the account confirmation link if not created already
      if (stillNeedToConfirmAccount) {
        dispatch({ type: ACTIONS.SET_ACCOUNT_PENDING_CONFIRMATION });
      }
    });
  };
}

export function doGetCustomerStatus() {
  return (dispatch: Dispatch) => {
    Lbryio.call(
      'customer',
      'status',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((customerStatusResponse) => {
      const lastFour =
        customerStatusResponse.PaymentMethods &&
        customerStatusResponse.PaymentMethods.length &&
        customerStatusResponse.PaymentMethods[0].card.last4;

      dispatch({
        type: ACTIONS.SET_PAYMENT_LAST_FOUR,
        data: lastFour,
      });

      // TODO: this is actually incorrect, last4 should be populated based on the transaction not the current customer details
      const defaultPaymentMethodId = customerStatusResponse?.Customer?.invoice_settings?.default_payment_method?.id;

      if (defaultPaymentMethodId) {
        dispatch({ type: ACTIONS.SET_HAS_SAVED_CARD });
      }
    });
  };
}
