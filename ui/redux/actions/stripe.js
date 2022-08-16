// @flow
import { doToast } from 'redux/actions/notifications';
import { Lbryio } from 'lbryinc';
import { selectChannelClaimIdForUri, selectChannelNameForUri } from 'redux/selectors/claims';

import * as ACTIONS from 'constants/action_types';
import * as STRIPE from 'constants/stripe';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

export const doTipAccountCheckForUri = (uri: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  const channelName = selectChannelNameForUri(state, uri);

  return await Lbryio.call(
    'account',
    'check',
    { channel_claim_id: channelClaimId, channel_name: channelName, environment: stripeEnvironment },
    'post'
  ).then(
    (accountCheckResponse) =>
      accountCheckResponse === true && dispatch({ type: ACTIONS.SET_CAN_RECEIVE_FIAT_TIPS, data: channelClaimId })
  );
};

export const doTipAccountStatus = (params: { getBank?: boolean, getTotals?: boolean, getInfo?: boolean }) => async (
  dispatch: Dispatch
) =>
  await Lbryio.call('account', 'status', { environment: stripeEnvironment }, 'post')
    .then((accountStatusResponse) => {
      const { getBank, getTotals, getInfo } = params;
      const { charges_enabled, total_received_unpaid, total_paid_out, account_info } = accountStatusResponse;

      if (getBank && charges_enabled) {
        dispatch({ type: ACTIONS.SET_BANK_ACCOUNT_CONFIRMED });
      } else if (getBank && !charges_enabled) {
        dispatch({ type: ACTIONS.SET_BANK_ACCOUNT_MISSING });
      }

      if (getTotals && total_received_unpaid && total_paid_out) {
        dispatch({
          type: ACTIONS.SET_STRIPE_ACCOUNT_TOTALS,
          data: { total_received_unpaid, total_paid_out },
        });
      }

      if (getInfo) {
        if (total_received_unpaid) {
          doListAccountTransactions();
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
            dispatch(doGetAndSetAccountLink(false));
          }

          dispatch({
            type: ACTIONS.SET_ACCOUNT_STATUS_FINISHED,
            data: accountStatusObj,
          });

          // user has not confirmed an account but have received payments
        } else if (total_received_unpaid > 0) {
          dispatch({ type: ACTIONS.SET_ACCOUNT_NOT_CONFIRMED_BUT_RECEIVED_TIPS });

          dispatch(doGetAndSetAccountLink());

          // user has not received any amount or confirmed an account
        } else {
          // get stripe link and set it on the frontend
          // pass true so it updates the frontend
          dispatch(doGetAndSetAccountLink(true));
        }
      }
    })
    .catch((error) => {
      const { getInfo } = params;
      dispatch({ type: ACTIONS.SET_BANK_ACCOUNT_MISSING });

      if (getInfo) {
        // errorString passed from the API (with a 403 error)
        const errorString = 'account not linked to user, please link first';

        // if it's beamer's error indicating the account is not linked yet
        if (error.message.indexOf(errorString) > -1) {
          // get stripe link and set it on the frontend
          dispatch(doGetAndSetAccountLink(true));
        } else {
          // probably an error from stripe
          const displayString = __('There was an error getting your account setup, please try again later');
          dispatch(doToast({ message: displayString, isError: true }));
          // not an error from Beamer, throw it
          return error;
        }
      }
    });

export const doCustomerListPaymentHistory = () => async (dispatch: Dispatch) =>
  await Lbryio.call('customer', 'list', { environment: stripeEnvironment }, 'post')
    .then((customerTransactionResponse: StripeTransactions) => {
      // reverse so order is from most recent to latest
      if (Number.isInteger(customerTransactionResponse?.length)) customerTransactionResponse.reverse();

      // TODO: remove this once pagination is implemented
      if (customerTransactionResponse?.length && customerTransactionResponse.length > 100) {
        customerTransactionResponse.length = 100;
      }

      dispatch({ type: ACTIONS.SET_ACCOUNT_PAYMENT_HISTORY, data: customerTransactionResponse });
    })
    .catch((e) => e);

export const doListAccountTransactions = () => async (dispatch: Dispatch) =>
  await Lbryio.call('account', 'list', { environment: stripeEnvironment }, 'post').then(
    (accountListResponse: StripeTransactions) => {
      // reverse so order is from most recent to latest
      if (Number.isInteger(accountListResponse?.length)) accountListResponse.reverse();

      // TODO: remove this once pagination is implemented
      if (accountListResponse && accountListResponse.length && accountListResponse.length > 100) {
        accountListResponse.length = 100;
      }

      dispatch({ type: ACTIONS.SET_ACCOUNT_TRANSACTIONS, data: accountListResponse });
    }
  );

export const doGetAndSetAccountLink = (stillNeedToConfirmAccount?: boolean) => async (dispatch: Dispatch) =>
  await Lbryio.call(
    'account',
    'link',
    {
      return_url: STRIPE.SUCCESS_REDIRECT_URL,
      refresh_url: STRIPE.FAILURE_REDIRECT_URL,
      environment: stripeEnvironment,
    },
    'post'
  ).then((accountLinkResponse) => {
    // stripe link for user to navigate to and confirm account
    const stripeConnectionUrl = accountLinkResponse.url;

    // set connection url on frontend
    dispatch({ type: ACTIONS.SET_STRIPE_CONNECTION_URL, data: stripeConnectionUrl });

    // show the account confirmation link if not created already
    if (stillNeedToConfirmAccount) dispatch({ type: ACTIONS.SET_ACCOUNT_PENDING_CONFIRMATION });
  });

export const doGetCustomerStatus = () => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS_STARTED });

  return await Lbryio.call('customer', 'status', { environment: stripeEnvironment }, 'post')
    .then((customerStatusResponse) => {
      dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS, data: customerStatusResponse });

      return customerStatusResponse;
    })
    .catch((e) => {
      dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS, data: null });

      return e;
    });
};

export const doRemoveCardForPaymentMethodId = (paymentMethodId: string) => async (dispatch: Dispatch) =>
  await Lbryio.call(
    'customer',
    'detach',
    { environment: stripeEnvironment, payment_method_id: paymentMethodId },
    'post'
  ).then(() => dispatch(doGetCustomerStatus()));
