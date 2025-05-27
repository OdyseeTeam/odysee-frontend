// @flow
import { Lbryio } from 'lbryinc';
import { selectChannelClaimIdForUri, selectChannelNameForUri } from 'redux/selectors/claims';
import { bufferToHex } from 'util/uint8array-to-hex';
import {
  selectAccountCheckIsFetchingForId,
  selectCustomerStatusFetching,
  selectAccountStatusFetching,
} from 'redux/selectors/stripe';
import { doToast } from 'redux/actions/notifications';

import * as ACTIONS from 'constants/action_types';
import * as STRIPE from 'constants/stripe';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

export const doTipAccountCheckForUri = (uri: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  const channelName = selectChannelNameForUri(state, uri);

  const isFetching = channelClaimId && selectAccountCheckIsFetchingForId(state, channelClaimId);

  if (isFetching) return;

  dispatch({ type: ACTIONS.CHECK_CAN_RECEIVE_FIAT_TIPS_STARTED, data: channelClaimId });

  return await Lbryio.call(
    'account',
    'check',
    { channel_claim_id: channelClaimId, channel_name: channelName, environment: stripeEnvironment, v2: true },
    'post'
  )
    .then((accountCheckResponse) =>
      dispatch({ type: ACTIONS.SET_CAN_RECEIVE_FIAT_TIPS, data: { accountCheckResponse, claimId: channelClaimId } })
    )
    .catch(() =>
      dispatch({
        type: ACTIONS.SET_CAN_RECEIVE_FIAT_TIPS,
        data: { accountCheckResponse: undefined, claimId: channelClaimId },
      })
    );
};

export const doTipAccountStatus = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isFetching = selectAccountStatusFetching(state);

  if (isFetching) return Promise.resolve();

  dispatch({ type: ACTIONS.STRIPE_ACCOUNT_STATUS_START });

  return await Lbryio.call('account', 'status', { environment: stripeEnvironment, v2: true }, 'post')
    .then((accountStatusResponse: StripeAccountStatus | AccountStatus) => {
      dispatch({ type: ACTIONS.STRIPE_ACCOUNT_STATUS_COMPLETE, data: accountStatusResponse });
      if (accountStatusResponse.arweave || accountStatusResponse.stripe) {
        return accountStatusResponse;
      }

      return { stripe: accountStatusResponse };
    })
    .catch((error) => {
      if (error.message === 'account not linked to user, please link first') {
        dispatch({ type: ACTIONS.STRIPE_ACCOUNT_STATUS_COMPLETE, data: false });
        return error;
      }

      dispatch(
        doToast({ message: __('There was an error getting your account setup, please try again later'), isError: true })
      );
      dispatch({ type: ACTIONS.STRIPE_ACCOUNT_STATUS_COMPLETE, data: null });
    });
};

export const doTipAccountRemove = () => async (dispatch: Dispatch, getState: GetState) => {
  return await Lbryio.call('account', 'remove', { environment: stripeEnvironment }, 'post')
    .then(() => dispatch(doTipAccountStatus()))
    .catch((error) => {
      dispatch(doToast({ message: error.message || error, isError: true }));
      throw Error(error.message || error);
    });
};

export const doGetAndSetAccountLink = () => async (dispatch: Dispatch) => {
  const currentUrl = window.location.href;

  return await Lbryio.call(
    'account',
    'link',
    { return_url: currentUrl, refresh_url: currentUrl, environment: stripeEnvironment },
    'post'
  ).then((accountLinkResponse: StripeAccountLink) => {
    dispatch({ type: ACTIONS.SET_ACCOUNT_LINK, data: accountLinkResponse });
    return accountLinkResponse;
  });
};

export const doCustomerListPaymentHistory = () => async (dispatch: Dispatch) =>
  await Lbryio.call('customer', 'list', { environment: stripeEnvironment }, 'post')
    .then((customerTransactionResponse: StripeTransactions) => {
      dispatch({ type: ACTIONS.SET_ACCOUNT_PAYMENT_HISTORY, data: customerTransactionResponse });
    })
    .catch((e) => e);

export const doCheckIfPurchasedClaimId = (claimId: string) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_STARTED });

  // we'll check if there's anything for the targeted id
  // if we're on a preorder and there is, build the purchase url with the reference (if exists)
  // if we're on a purchase and there is, show the video
  return await Lbryio.call('customer', 'list', { environment: stripeEnvironment, claim_id_filter: claimId }, 'post')
    .then((response) => dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_COMPLETED, data: response }))
    .catch((e) => dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_FAILED, data: { error: e.message } }));
};

export const doCheckIfPurchasedClaimIds = (claimIds: ClaimIds) => {
  // TODO:
  // - This is a separate function for now to reduce churn. There should just be
  // a single doCustomerList(...) that can do different actions based on function
  // parameters, so we'll update everything then.
  // - 'myPurchasedClaims' is an unnecessary duplicate of 'customerTransactionResponse'.
  // Just share the storage and do a fetch-all when viewing transaction history.
  // - Move the reducer to the stripe slice.

  return (dispatch: Dispatch) => {
    const params: StripeCustomerListParams = {
      environment: stripeEnvironment,
      claim_id_filter: claimIds.join(','),
    };

    dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_STARTED });

    return Lbryio.call('customer', 'list', params, 'post')
      .then((response) => dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_COMPLETED, data: response }))
      .catch((e) => dispatch({ type: ACTIONS.CHECK_IF_PURCHASED_FAILED, data: e.message }));
  };
};

export const doCustomerPurchaseCost =
  (cost: number) =>
  (dispatch: Dispatch): Promise<StripeCustomerPurchaseCostResponse> => {
    return Lbryio.call('customer', 'purchase_cost', { environment: stripeEnvironment, amount: cost });
  };

export const doListAccountTransactions = () => async (dispatch: Dispatch) =>
  await Lbryio.call('account', 'list', { environment: stripeEnvironment }, 'post').then(
    (accountListResponse: StripeTransactions) => {
      // reverse so order is from most recent to latest
      if (Number.isInteger(accountListResponse?.length)) accountListResponse.reverse();

      dispatch({ type: ACTIONS.SET_ACCOUNT_TRANSACTIONS, data: accountListResponse });
    }
  );

export const doGetCustomerStatus = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isFetching = selectCustomerStatusFetching(state);

  if (isFetching) return;

  dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS_STARTED });

  return await Lbryio.call('customer', 'status', { environment: stripeEnvironment }, 'post')
    .then((customerStatusResponse: StripeCustomerStatus) => {
      dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS, data: customerStatusResponse });

      return customerStatusResponse;
    })
    .catch((error) => {
      if (error === 'internal_apis_down') {
        dispatch(doToast({ message: __(STRIPE.APIS_DOWN_ERROR_RESPONSE), isError: true }));
      } else if (error.message === 'user as customer is not setup yet') {
        // probably doesn't need to do a toast message for this
      } else {
        // probably an error from stripe
        dispatch(doToast({ message: __(STRIPE.CARD_SETUP_ERROR_RESPONSE), isError: true }));
      }

      if (typeof error === 'object' && error?.message === 'user as customer is not setup yet') {
        // Set data to null to flag that customer was technically fetched succesfully.
        // Account deletion sequence will halt if customer is `undefined`
        dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS, data: null });
      } else {
        dispatch({ type: ACTIONS.SET_CUSTOMER_STATUS, data: undefined });
      }

      return error;
    });
};

export const doCustomerSetup = () => async (dispatch: Dispatch) =>
  await Lbryio.call('customer', 'setup', { environment: stripeEnvironment }, 'post').then(
    (customerSetupResponse: StripeCustomerSetupResponse) => {
      dispatch({ type: ACTIONS.SET_CUSTOMER_SETUP_RESPONSE, data: customerSetupResponse });
      return customerSetupResponse;
    }
  );

export const doCustomerRemove = () => async (dispatch: Dispatch) =>
  await Lbryio.call('customer', 'remove', { environment: stripeEnvironment }, 'post')
    .then(() => dispatch(doGetCustomerStatus()))
    .catch((error) => {
      dispatch(doToast({ message: error.message || error, isError: true }));
      throw Error(error.message || error);
    });

export const doRemoveCardForPaymentMethodId = (paymentMethodId: string) => async (dispatch: Dispatch) =>
  await Lbryio.call(
    'customer',
    'detach',
    { environment: stripeEnvironment, payment_method_id: paymentMethodId },
    'post'
  ).then(() => dispatch(doGetCustomerStatus()));

// changed currency here to 'AR' because API will currently only return an ar amount to pay if so.
const registerAddress = async (address: string, makeDefault: boolean, currency = 'AR') => {
  try {
    const pub_key = await window.arweaveWallet.getActivePublicKey();
    const data = new TextEncoder().encode(address);
    const signature = await window.arweaveWallet.signMessage(data);
    const hexSig = bufferToHex(signature);
    const params = { currency, pub_key, signature: hexSig };
    if (makeDefault) {
      // $FlowIgnore
      params.default = true;
    }
    const res = await Lbryio.call('arweave/address', 'add', params, 'post');
    return res;
    // get public key
    // sign the address
    // send to api with
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateAddressStatus = async (id: string, status: string) => {
  try {
    const res = await Lbryio.call('arweave/address', 'update', { id, status }, 'post'); // 'active' | 'inactive'
    return res;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateDefault = async (id: string) => {
  try {
    const res = await Lbryio.call('arweave/address', 'update', { id, set_default: true }, 'post');
    return res;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const doRegisterArweaveAddress = (address: string, makeDefault: boolean) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.AR_ADDR_REGISTER_STARTED, data: address });
  try {
    await registerAddress(address, makeDefault);
    await dispatch(doTipAccountStatus());
    dispatch({ type: ACTIONS.AR_ADDR_REGISTER_SUCCESS, data: address });
  } catch (e) {
    console.error(e);
    dispatch({ type: ACTIONS.AR_ADDR_REGISTER_ERROR, data: e?.message || e });
  }
};

export const doUpdateArweaveAddressStatus =
  (id: string, status: 'active' | 'inactive') => async (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.AR_ADDR_UPDATE_STARTED, data: id });
    try {
      await updateAddressStatus(id, status);
      // now do account status
      await dispatch(doTipAccountStatus());
      dispatch({ type: ACTIONS.AR_ADDR_UPDATE_SUCCESS, data: id });
    } catch (e) {
      console.error(e);
      dispatch({ type: ACTIONS.AR_ADDR_UPDATE_ERROR, data: e?.message || e });
    }
  };

export const doUpdateArweaveAddressDefault = (id: string) => async (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.AR_ADDR_DEFAULT_STARTED, data: id });
  try {
    await updateDefault(id);

    await dispatch(doTipAccountStatus());
    dispatch({ type: ACTIONS.AR_ADDR_DEFAULT_SUCCESS, data: id });
  } catch (e) {
    console.error(e);
    dispatch({ type: ACTIONS.AR_ADDR_DEFAULT_ERROR, data: e?.message || e });
  }
};
