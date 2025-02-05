// @flow
import { Lbryio } from 'lbryinc';
import * as MODALS from 'constants/modal_types';
import {
  ARCONNECT_FAILURE,
  ARCONNECT_STARTED,
  ARCONNECT_SUCCESS,
  ARCONNECT_DISCONNECT,
  ARCONNECT_FETCHBALANCE,
  AR_TIP_STATUS_STARTED,
  AR_TIP_STATUS_SUCCESS,
  AR_TIP_STATUS_ERROR,
} from 'constants/action_types';
import { dryrun, message, createDataItemSigner } from '@permaweb/aoconnect';
import { selectAPIArweaveActiveAddress } from '../selectors/stripe';
import { doOpenModal } from './app';
const gFlags = {
  arconnectWalletSwitchListenerAdded: false,
};
export const WALLET_PERMISSIONS = [
  'ACCESS_ADDRESS',
  'ACCESS_PUBLIC_KEY',
  'SIGN_TRANSACTION',
  'DISPATCH',
  'SIGNATURE',
  'ENCRYPT',
  'DECRYPT',
];

const USD_TO_USDC = 1000000;

export const ARCONNECT_TYPE = 'arConnect';

export function doArConnect() {
  console.log('doarconnect');
  return async (dispatch, getState) => {
    dispatch({ type: ARCONNECT_STARTED });
    if (window.arweaveWallet) {
      try {
        await global.window?.arweaveWallet?.connect(WALLET_PERMISSIONS);
        console.log('connected');

        if (!gFlags.arconnectWalletSwitchListenerAdded) {
          // Attached throughout app-lifetime, so no need to clean up.
          window.addEventListener('walletSwitch', handleWalletSwitched);
          gFlags.arconnectWalletSwitchListenerAdded = true;
        }

        const address = await global.window.arweaveWallet.getActiveAddress();
        const currentState = getState();
        const apiActiveAddress = selectAPIArweaveActiveAddress(currentState);

        const USDCBalance = await fetchUSDCBalance(address);
        dispatch({
          type: ARCONNECT_SUCCESS,
          data: {
            address,
            type: ARCONNECT_TYPE,
            usdc: USDCBalance,
          },
          wallet: window.arweaveWallet,
        });

        // if needs interaction, launch modal
        if (apiActiveAddress !== address) {
          dispatch(doOpenModal(MODALS.ARWEAVE_CONNECT));
          return;
        }
      } catch (e) {
        console.log('error:', e);
        dispatch({ type: ARCONNECT_FAILURE, data: { error: e?.message || 'Error connecting to Arconnect.' } });
      }
    } else {
      dispatch({ type: ARCONNECT_FAILURE, data: { error: 'Arconnect not found, install the extension.' } });
    }

    function handleWalletSwitched(event) {
      if (event?.detail?.address) {
        dispatch({
          type: ARCONNECT_SUCCESS,
          data: { address: event.detail.address, type: ARCONNECT_TYPE, wallet: window.arweaveWallet },
        });
      }
    }
  };
}

export function doArUpdateBalance() {
  return async (dispatch) => {
    dispatch({ type: ARCONNECT_FETCHBALANCE });
    if (window.arweaveWallet) {
      try {
        const address = await global.window.arweaveWallet.getActiveAddress();
        const USDCBalance = await fetchUSDCBalance(address);
        dispatch({
          type: ARCONNECT_SUCCESS,
          data: {
            address,
            type: ARCONNECT_TYPE,
            usdc: USDCBalance,
          },
          wallet: window.arweaveWallet,
        });
      } catch (e) {
        dispatch({ type: ARCONNECT_FAILURE, data: { error: e?.message || 'Error connecting to Arconnect.' } });
      }
    } else {
      dispatch({ type: ARCONNECT_FAILURE, data: { error: 'Arconnect not found, install the extension.' } });
    }
  };
}

export function doArDisconnect() {
  return async (dispatch) => {
    dispatch({ type: ARCONNECT_STARTED });
    if (window.arweaveWallet) {
      try {
        await global.window?.arweaveWallet?.disconnect();
        dispatch({ type: ARCONNECT_DISCONNECT });
      } catch (e) {
        dispatch({ type: ARCONNECT_FAILURE, data: { error: e?.message || 'Error connecting to Arconnect.' } });
      }
    }
  };
}

type TipParams = {
  tipAmountTwoPlaces: number,
  tipChannelName: string,
  channelClaimId: string,
  recipientAddress: string,
};
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };
const doArTip = async (
  tipParams: TipParams,
  anonymous: boolean,
  userParams: UserParams,
  claimId: string,
  stripeEnvironment,
  preferredCurrency = 'USD',
  successCallback
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: AR_TIP_STATUS_STARTED, data: { claimId: claimId } });
    console.log(tipParams, userParams, claimId, stripeEnvironment, preferredCurrency);
    dispatch({ type: AR_TIP_STATUS_SUCCESS, data: { claimId: claimId } });
    return;

    try {
      if (!window.arweaveWallet) {
        dispatch({ type: AR_TIP_STATUS_ERROR, data: { claimId: claimId, error: 'error: no wallet connection' } });
        return;
      }

      const state = getState();
      const senderAddress = selectAPIArweaveActiveAddress(state);
      if (window.arweaveWallet.getActiveAddress() !== senderAddress) {
        dispatch({ type: AR_TIP_STATUS_ERROR, data: { claimId: claimId, error: 'error: address not registered' } });
        return;
      }

      let isRetry = false;
      if (state.arwallet.tippingStatusById[claimId] === 'error') {
        isRetry = true;
      }
      if (!isRetry) {
        await Lbryio.call(
          'customer',
          'tip',
          {
            // round to fix issues with floating point numbers
            amount: Math.round(USD_TO_USDC * tipParams.tipAmountTwoPlaces), // convert from dollars to cents
            creator_channel_name: tipParams.tipChannelName, // creator_channel_name
            creator_channel_claim_id: tipParams.channelClaimId,
            tipper_channel_name: anonymous ? '' : userParams.activeChannelName,
            tipper_channel_claim_id: anonymous ? '' : userParams.activeChannelId,
            currency: 'USD',
            anonymous: anonymous,
            source_claim_id: claimId,
            receiver_address: tipParams.recipientAddress,
            sender_address: senderAddress,
            environment: stripeEnvironment,
            v2: true,
            initiate: true,
          },
          'post'
        );
      }

      const transferTxid = await message({
        process: '7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ',
        data: '',
        tags: [
          { name: 'Action', value: 'Transfer' },
          { name: 'Quantity', value: tipParams.tipAmountTwoPlaces * USD_TO_USDC }, // test/fix
          { name: 'Recipient', value: tipParams.recipientAddress }, // get address
          { name: 'Tip_Type', value: 'tip' },
          { name: 'Claim_ID', value: claimId },
        ],
        Owner: senderAddress, // test/fix
        signer: createDataItemSigner(window.arweaveWallet),
      });
      await Lbryio.call(
        'customer',
        'tip',
        {
          // round to fix issues with floating point numbers
          amount: Math.round(USD_TO_USDC * tipParams.tipAmountTwoPlaces), // convert from dollars to cents
          creator_channel_name: tipParams.tipChannelName, // creator_channel_name
          creator_channel_claim_id: tipParams.channelClaimId,
          tipper_channel_name: anonymous ? '' : userParams.activeChannelName,
          tipper_channel_claim_id: anonymous ? '' : userParams.activeChannelId,
          currency: 'USD',
          anonymous: anonymous,
          source_claim_id: claimId,
          receiver_address: tipParams.recipientAddress,
          sender_address: senderAddress,
          environment: stripeEnvironment,
          v2: true,
          tx_id: transferTxid,
        },
        'post'
      );
    } catch (e) {
      console.error(e);
      dispatch({ type: AR_TIP_STATUS_ERROR, data: { claimId: claimId, error: e.message } });
    }
    dispatch({ type: AR_TIP_STATUS_SUCCESS, data: { claimId: claimId } });
  };
};

const fetchUSDCBalance = async (address: string) => {
  try {
    const result = await dryrun({
      process: '7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ',
      data: '',
      tags: [{ name: 'Action', value: 'Balance' }],
      Owner: address,
    });
    if (result && result.Messages && result.Messages[0]) {
      const message = result?.Messages?.[0];
      // $FlowIgnore
      const balance = message?.Tags?.find((tag: any) => tag.name === 'Balance')?.value;
      return balance ? Number(balance) / 1000000 : 0;
    } else {
      return 0;
    }
  } catch (e) {
    console.error(e);
    return 0;
  }
};

const updateAddress = async (id: string, status: string) => {
  try {
    const res = await Lbryio.call('arweave/address', 'update', { id, status }, 'post');
    return;
  } catch (e) {
    console.error(e);
  }
};

const updateDefault = async (id: string) => {
  try {
    const res = await Lbryio.call('arweave/address', 'update', { id, set_default: true }, 'post');
    return;
  } catch (e) {
    console.error(e);
  }
};

const registerAddress = async (address: string, currency = 'USD') => {
  try {
    const pub_key = window.arweaveWallet.getActivePublicKey();
    const data = new TextEncoder().encode(address);
    const signature = await window.arweaveWallet.signMessage(data);
    const res = await Lbryio.call('arweave/address', 'add', { currency, address, pub_key, signature }, 'post');
    return;
    // get public key
    // sign the address
    // send to api with
  } catch (e) {
    console.error(e);
  }
};
