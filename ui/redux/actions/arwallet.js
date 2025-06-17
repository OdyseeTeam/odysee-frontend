// @flow
import { Lbryio } from 'lbryinc';
import * as MODALS from 'constants/modal_types';
import {
  ARCONNECT_FAILURE,
  ARCONNECT_STARTED,
  ARCONNECT_SUCCESS,
  ARCONNECT_DISCONNECT,
  ARCONNECT_FETCHBALANCE,
  ARSETEXCHANGERATE,
  AR_TIP_STATUS_STARTED,
  AR_TIP_STATUS_SUCCESS,
  AR_TIP_STATUS_ERROR,
  WANDER_AUTH,
  AR_SEND_STARTED,
  AR_SEND_ERROR,
  AR_SEND_SUCCESS,
} from 'constants/action_types';
// $FlowIgnore
import { message, createDataItemSigner } from '@permaweb/aoconnect';
import { selectAPIArweaveDefaultAddress } from '../selectors/stripe';
import { doToast } from 'redux/actions/notifications';
import { doOpenModal } from './app';
// $FlowIgnore
import { Dispatch } from 'react';
import { LocalStorage } from 'util/storage';
import arweave from 'util/arweave';
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
  'ACCESS_TOKENS',
];

const USD_TO_USDC = 1000000;
const TWO_PLACES_TO_PENNIES = 100;
export const ARCONNECT_TYPE = 'arConnect';

const fetchARExchangeRate = async () => {
  try {
    const res = await Lbryio.call(
      // : { data, success, error }
      'arweave',
      'exchange_rate',
      {},
      'post'
    );
    return res;
  } catch (e) {
    return 0;
  }
};

export function doArInit() {
  return async (dispatch: Dispatch, getState: GetState) => {
    try {
      const arExchangeRate = await fetchARExchangeRate();
      dispatch({ type: ARSETEXCHANGERATE, data: Number(arExchangeRate) });
    } catch (e) {
      console.log(e);
    }
  };
}

export function doArConnect() {
  console.log('doArConnect')
  LocalStorage.setItem('WANDER_DISCONNECT', false);
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: ARCONNECT_STARTED });
    if (window.arweaveWallet) {
      try {
        // $FlowIgnore
        await global.window?.arweaveWallet?.connect(WALLET_PERMISSIONS);
        window.wanderInstance.close();

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

        // const USDCBalance = await fetchUSDCBalance(address);
        const ARBalance = await fetchARBalance(address);
        const arExchangeRate = await fetchARExchangeRate();
        dispatch({
          type: ARCONNECT_SUCCESS,
          data: {
            address,
            type: ARCONNECT_TYPE,
            // usdc: USDCBalance,
            ar: ARBalance,
            usdPerAr: arExchangeRate,
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
        // const USDCBalance = await fetchUSDCBalance(address);
        const ARBalance = await fetchARBalance(address);
        const arExchangeRate = await fetchARExchangeRate();
        dispatch({
          type: ARCONNECT_SUCCESS,
          data: {
            address,
            type: ARCONNECT_TYPE,
            // usdc: USDCBalance,
            ar: ARBalance,
            usdPerAr: arExchangeRate,
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
  LocalStorage.setItem('WANDER_DISCONNECT', true)

  return async (dispatch: Dispatch) => {
    dispatch({ type: ARCONNECT_STARTED });
    if (window.arweaveWallet) {
      try {
        // $FlowIgnore
        await global.window?.arweaveWallet?.disconnect();
        dispatch({ type: ARCONNECT_DISCONNECT });
      } catch (e) {
        dispatch({ type: ARCONNECT_FAILURE, data: { error: e?.message || 'Error connecting to Arconnect.' } });
      }
    }
  };
}

type LocalTipParams = {
  tipAmountTwoPlaces: number,
  tipChannelName: string,
  channelClaimId: string,
  recipientAddress: string,
  currency: 'USD' | 'AR',
};
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };

// just using this to check the wallet is unlocked
export const doArSign = (msg: string) => {
  return async (dispatch: Dispatch) => {
    try {
      if (!window.arweaveWallet) {
        throw new Error('arweaveWallet not found.');
      }
      const data = new TextEncoder().encode(msg);
      const signature = await window.arweaveWallet.signMessage(data);
      const isValidSignature = await window.arweaveWallet.verifyMessage(data, signature);
      return isValidSignature;
    } catch (e) {
      return false;
    }
  };
};

export const doArTip = (
  tipParams: LocalTipParams,
  anonymous: boolean,
  userParams: UserParams,
  claimId: string,
  stripeEnvironment: string
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: AR_TIP_STATUS_STARTED, data: { claimId: claimId } });
    let referenceToken = '';
    let transferTxid = '';
    let transactionAmount;
    console.log('artip');
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
            currency: tipParams.currency, // 'AR'
            anonymous: anonymous,
            source_claim_id: claimId,
            receiver_address: tipParams.recipientAddress,
            sender_address: senderAddress,
            environment: stripeEnvironment,
            v2: true,
          },
          'post'
        );
        if (res.error) {
          dispatch({
            type: AR_TIP_STATUS_ERROR,
            data: { claimId: claimId, error: res.error },
          });
          return;
        }
        referenceToken = res.reference_token;
        transactionAmount = res.transaction_amount;
      }

      const tags = [
        { name: 'Tip_Type', value: 'tip' },
        { name: 'Claim_ID', value: claimId },
        { name: 'X-O-Ref', value: referenceToken },
      ];

      const transactionAmountString = String(transactionAmount);
      if (tipParams.currency === 'AR') {
        try {
          const { transferTxid: txid } = await sendWinstons(tipParams.recipientAddress, transactionAmountString, tags);
          transferTxid = txid;
        } catch (error) {
          console.log(error);
          dispatch({
            type: AR_TIP_STATUS_ERROR,
            data: { claimId: claimId, error: 'error: arweave transaction failed' },
          });
          return  { error: error?.message || error };
        }
      } else if (tipParams.currency === 'USD') {
        // This not currently used
        // AO Onramper USDC
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
      }

      if (!transferTxid) {
        const er = 'error: arweave transaction failed';
        dispatch({
          type: AR_TIP_STATUS_ERROR,
          data: { claimId: claimId, error: er },
        });
        return  { error: er };
      }

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
          currency: tipParams.currency,
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
      return { error: e?.message || e };
    }
    dispatch({ type: AR_TIP_STATUS_SUCCESS, data: { claimId: claimId } });
    // support comments need the transferTxid, so return that here.
    return { transferTxid: transferTxid, currency: tipParams.currency, referenceToken: referenceToken };
  };
};

function getBalanceEndpoint(wallet: string) {
  return `https://arweave.net/wallet/${wallet}/balance`;
}

const fetchARBalance = async (address: string) => {
  try {
    const rawBalance = await fetch(getBalanceEndpoint(address));
    const jsonBalance = await rawBalance.json();
    const arBalance = jsonBalance / 1e12;
    return arBalance;
  } catch (e) {
    console.error(e);
    return -1;
  }
};

export const sendWinstons = async (
  address: string,
  amountInWinstons: string,
  tags: Array<{ name: string, value: string }>
) => {
  let txResponse: { status: number, statusText: string, data: any };
  try {
    const createParams = {
      target: address,
      recipient: address,
      quantity: amountInWinstons,
    };
    const transaction = await arweave.createTransaction(createParams);

    tags.forEach((t) => {
      transaction.addTag(t.name, t.value);
    });

    await arweave.transactions.sign(transaction);

    txResponse = await arweave.transactions.post(transaction);
    const { status } = txResponse;
    if (status !== 200) {
      return { error: 'transaction failed', transactionId: txResponse.transactionId, status };
    }
    console.log(txResponse);
    const { id } = transaction;
    return { transactionId: id, status };
  } catch (e) {
    console.error('ERROR SENDING WINSTONS', e);
    return { error: 'Unknown Error' };
  }
};

export const doArSetAuth = (status: any) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: WANDER_AUTH, data: status });
  };
};

export const doArSend = (recipientAddress: string, amountAr: number) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: AR_SEND_STARTED });

    if (!window.arweaveWallet) {
      dispatch({ type: AR_SEND_ERROR, data: { error: 'arweaveWallet not found.' } });
      return { error: 'arweaveWallet not found.' };
    }

    const isValidArweaveAddress = (address) => /^[A-Za-z0-9_-]{43}$/.test(address);
    if (!isValidArweaveAddress(recipientAddress)) {
      dispatch({ type: AR_SEND_ERROR, data: { error: 'Invalid Arweave address.' } });
      return { error: 'Invalid Arweave address.' };
    }

    try {
      const amountInWinstons = arweave.ar.arToWinston(amountAr.toString());
      const testParams = {
        target: recipientAddress,
        recipient: recipientAddress,
        quantity: amountInWinstons,
      };

      const transactionCheck = await arweave.createTransaction(testParams);
      let transaction = null
      if(transactionCheck.quantity >= amountInWinstons){
        const newParams = {
          target: recipientAddress,
          recipient: recipientAddress,
          quantity: String(amountInWinstons - transactionCheck.reward),
        };
        transaction = await arweave.createTransaction(newParams);
        await arweave.transactions.sign(transaction);
      }else {
        transaction = transactionCheck;
        await arweave.transactions.sign(transaction);
      }      
      console.log('Transaction: ', transaction)
      arweave.transactions.sign(transaction);
      console.log('Signed Transaction: ', transaction)
      const response = await arweave.transactions.post(transaction);

      console.log('Response: ', response)

      dispatch(doToast({
        message: `${amountAr} AR successfully sent to ${recipientAddress}`,
      }));
      dispatch({ type: AR_SEND_SUCCESS, data: { txId: response.id, recipient: recipientAddress, amount: amountAr } });      
      return { txId: response.id };
    } catch (e) {
      console.log('ERR: ', e)
      dispatch(doToast({
        message: e.message || 'Failed to send AR',
        isError: true
      }));
      dispatch({ type: AR_SEND_ERROR, data: { error: e.message || 'Failed to send AR' } });      
      return { error: e.message || 'Failed to send AR' };
    }
  };
};


