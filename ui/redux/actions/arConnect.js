// @flow
import * as ACTIONS from 'constants/action_types';
import { selectPrefsReady } from 'redux/selectors/sync';
import { doAlertWaitingForSync } from 'redux/actions/app';

const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];

export const doConnectArConnect = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  console.log('Redux State:', state);

  // const ready = selectPrefsReady(state);

  console.log('handleArConnect');

  if (!window.arweaveWallet) return;

  try {
    await window.arweaveWallet.connect(WALLET_PERMISSIONS);
    const address = await window.arweaveWallet.getActiveAddress();

    // setWalletAddress(address);
    // setWallet(window.arweaveWallet);
    // setWalletType(WalletEnum.arConnect);

    dispatch({
      type: ACTIONS.CONNECT_AR_CONNECT,
      data: {
        connected: true,
        address,
      },
    });
  } catch (e) {
    console.error(e);
    return;
  }
};

export const doDisconnectArConnect = (chargeCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const ready = selectPrefsReady(state);

  if (!ready) {
    return dispatch(doAlertWaitingForSync());
  }

  dispatch({
    type: ACTIONS.DISCONNECT_AR_CONNECT,
    data: {
      chargeCode,
    },
  });
};
