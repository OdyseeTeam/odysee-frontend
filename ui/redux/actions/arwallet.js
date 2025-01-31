import { ARCONNECT_FAILURE, ARCONNECT_STARTED, ARCONNECT_SUCCESS, ARCONNECT_NAGGED } from 'constants/action_types';
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

export const ARCONNECT_TYPE = 'arConnect';

export function doArNagged() {
  return { type: ARCONNECT_NAGGED };
}

export function doArConnect() {
  return async (dispatch) => {
    dispatch({ type: ARCONNECT_STARTED });
    if (window.arweaveWallet) {
      try {
        await global.window?.arweaveWallet?.connect(WALLET_PERMISSIONS);

        if (!gFlags.arconnectWalletSwitchListenerAdded) {
          // Attached throughout app-lifetime, so no need to clean up.
          window.addEventListener('walletSwitch', handleWalletSwitched);
          gFlags.arconnectWalletSwitchListenerAdded = true;
        }

        const address = await global.window.arweaveWallet.getActiveAddress();
        dispatch({ type: ARCONNECT_SUCCESS, data: { address, type: ARCONNECT_TYPE, wallet: window.arweaveWallet } });
        return address;
      } catch (e) {
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
