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
import { selectAPIArweaveDefaultAddress } from '../selectors/stripe';
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
const TWO_PLACES_TO_PENNIES = 100;
export const ARCONNECT_TYPE = 'arConnect';

export function doArConnect() {
  console.log('doarconnect');
  return async (dispatch: Dispatch, getState: GetState) => {
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
        const apiDefaultAddress = selectAPIArweaveDefaultAddress(currentState);
        const currentModalId = currentState.app.modal;
        const currentModalProps = currentState.app.modalProps;

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
        if (apiDefaultAddress !== address) {
          dispatch(
            doOpenModal(MODALS.ARWEAVE_CONNECT, {
              previousModal: currentModalId ? { id: currentModalId, modalProps: currentModalProps } : undefined,
            })
          );
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
        dispatch(doArDisconnect());
      }
    }
  };
}

export function doArUpdateBalance() {
  return async (dispatch: Dispatch) => {
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
  return async (dispatch: Dispatch) => {
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
export const doArTip = (
  tipParams: TipParams,
  anonymous: boolean,
  userParams: UserParams,
  claimId: string,
  stripeEnvironment: string,
  preferredCurrency: string = 'USD'
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: AR_TIP_STATUS_STARTED, data: { claimId: claimId } });
    let referenceToken = '';
    let transferTxid = '';
    try {
      if (!window.arweaveWallet) {
        dispatch({ type: AR_TIP_STATUS_ERROR, data: { claimId: claimId, error: 'error: no wallet connection' } });
        return;
      }

      const state = getState();
      const senderAddress = selectAPIArweaveDefaultAddress(state);
      const activeAddress = await window.arweaveWallet.getActiveAddress();
      if (activeAddress !== senderAddress) {
        dispatch({
          type: AR_TIP_STATUS_ERROR,
          data: { claimId: claimId, error: 'error: wallet address not registered' },
        });
        return;
      }

      let isRetry = false;
      // if (state.arwallet.tippingStatusById[claimId] === 'error') {
      //   isRetry = true;
      // }

      if (!isRetry) {
        const res = await Lbryio.call(
          // : { data, success, error }
          'customer',
          'tip',
          {
            // round to fix issues with floating point numbers
            amount: Math.round(TWO_PLACES_TO_PENNIES * tipParams.tipAmountTwoPlaces), // convert from dollars to cents
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
          },
          'post'
        );
        console.log('res', res); // res.token?
        referenceToken = res.reference_token;
      }

      transferTxid = await message({
        process: '7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ',
        data: '',
        tags: [
          { name: 'Action', value: 'Transfer' },
          { name: 'Quantity', value: String(tipParams.tipAmountTwoPlaces * USD_TO_USDC) }, // test/fix
          { name: 'Recipient', value: tipParams.recipientAddress }, // get address
          { name: 'Tip_Type', value: 'tip' },
          { name: 'Claim_ID', value: claimId },
          { name: 'X-O-Ref', value: referenceToken },
        ],
        Owner: senderAddress, // test/fix
        signer: createDataItemSigner(window.arweaveWallet),
      });
      await Lbryio.call(
        'customer',
        'tip',
        {
          // round to fix issues with floating point numbers
          amount: Math.round(TWO_PLACES_TO_PENNIES * tipParams.tipAmountTwoPlaces), // convert from dollars to cents
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
          token: referenceToken,
        },
        'post'
      );
    } catch (e) {
      console.error(e);
      dispatch({ type: AR_TIP_STATUS_ERROR, data: { claimId: claimId, error: e.message } });
    }
    dispatch({ type: AR_TIP_STATUS_SUCCESS, data: { claimId: claimId } });
    // TODO: consider what to return here.
    return { transferTxid: transferTxid, currency: 'USD', referenceToken: referenceToken };
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
