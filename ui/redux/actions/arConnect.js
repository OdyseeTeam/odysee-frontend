// @flow
import * as ACTIONS from 'constants/action_types';

const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];

export const doConnectArConnect = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  if (!window.arweaveWallet) return;

  try {
    await window.arweaveWallet.connect(WALLET_PERMISSIONS);
    const address = await window.arweaveWallet.getActiveAddress();

    dispatch({
      type: ACTIONS.CONNECT_AR_CONNECT,
      data: {
        status: 'connected',
        address,
      },
    });
  } catch (e) {
    console.error(e);
    return;
  }
};

export const doDisconnectArConnect = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    await global.window?.arweaveWallet?.disconnect();
    dispatch({
      type: ACTIONS.CONNECT_AR_CONNECT,
      data: {
        status: 'disconnected',
        address: undefined,
      },
    });
  } catch (e) {
    console.error(e);
    return;
  }
};

export const doCheckArConnectStatus = () => async (dispatch) => {
  try {
    const address = await window.arweaveWallet.getActiveAddress();
    dispatch({
      type: ACTIONS.CHECK_AR_CONNECT_STATUS,
      data: {
        status: Boolean(address) ? 'connected' : 'disconnected',
        address,
      },
    });
  } catch (e) {
    dispatch({
      type: ACTIONS.CHECK_AR_CONNECT_STATUS,
      data: {
        status: 'disconnected',
        address: undefined,
      },
    });
  }
};
