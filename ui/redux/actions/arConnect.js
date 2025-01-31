// @flow
import { Dispatch } from 'redux';
import * as ACTIONS from 'constants/action_types';
// $FlowIgnore
import { dryrun } from '@permaweb/aoconnect';

const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];

export const doConnectArConnect = () => async (dispatch: Dispatch) => {
  if (!window.arweaveWallet) return;

  try {
    // $FlowIgnore
    await window.arweaveWallet.connect(WALLET_PERMISSIONS);
    const address = await window.arweaveWallet.getActiveAddress();
    const balance = await checkUSDCBalance(address);

    dispatch({
      type: ACTIONS.CONNECT_AR_CONNECT,
      data: {
        status: 'connected',
        address,
        balance: balance,
      },
    });
  } catch (e) {
    console.error(e);
  }
};

export const doDisconnectArConnect = () => async (dispatch: Dispatch) => {
  try {
    // $FlowIgnore
    await global.window?.arweaveWallet?.disconnect();
    dispatch({
      type: ACTIONS.CONNECT_AR_CONNECT,
      data: {
        status: 'disconnected',
        address: undefined,
        balance: 0,
      },
    });
  } catch (e) {
    console.error(e);
  }
};

export const doCheckArConnectStatus = () => async (dispatch: Dispatch) => {
  if (!window.arweaveWallet) {
    dispatch({
      type: ACTIONS.CHECK_AR_CONNECT_STATUS,
      data: {
        status: 'missingplugin',
        address: undefined,
        balance: 0,
      },
    });
  }

  try {
    // $FlowIgnore
    const address = await window.arweaveWallet.getActiveAddress();
    const balance = await checkUSDCBalance(address);

    dispatch({
      type: ACTIONS.CHECK_AR_CONNECT_STATUS,
      data: {
        status: address ? 'connected' : 'disconnected',
        address,
        balance: balance,
      },
    });
  } catch (e) {
    dispatch({
      type: ACTIONS.CHECK_AR_CONNECT_STATUS,
      data: {
        status: 'disconnected',
        address: undefined,
        balance: 0,
      },
    });
  }
};

const checkUSDCBalance = async (address: string) => {
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
      return balance ? Number(balance) : 0;
    } else {
      return 0;
    }
  } catch (e) {
    console.error(e);
    return 0;
  }
};
