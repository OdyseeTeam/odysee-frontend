// @flow
import * as ACTIONS from 'constants/action_types';
import * as PAGES from 'constants/pages';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
import Lbry from 'lbry';
import { getAuthToken } from 'util/saved-passwords';
import { LocalStorage, LS } from 'util/storage';

type Store = { dispatch: Dispatch, getState: GetState };

export const populateAuthTokenHeader = (store: Store) => {
  return (next: any) => (action: any) => {
    // @if TARGET='web'
    const { dispatch, getState } = store;

    switch (action.type) {
      case ACTIONS.USER_FETCH_SUCCESS:
      case ACTIONS.AUTHENTICATION_SUCCESS:
        if (action.data.user.has_verified_email === true) {
          const authToken = getAuthToken();
          Lbry.setApiHeader(X_LBRY_AUTH_TOKEN, authToken);
          dispatch({ type: ACTIONS.USER_LOGGED_IN_BROADCAST });
        }
        break;

      case ACTIONS.USER_LOGGED_IN_BROADCAST:
        // $FlowIgnore: href does exist
        const isVerifyPage = location.href.includes(PAGES.AUTH_VERIFY) && !location.href.includes(PAGES.REWARDS_VERIFY);
        const isNewAccount = LocalStorage.getItem(LS.IS_NEW_ACCOUNT) === 'true';
        const xAuth = (Lbry.getApiRequestHeaders() || {})[X_LBRY_AUTH_TOKEN] || '';
        const state = getState();

        if (!xAuth && !state.user.authenticationIsPending) {
          if (isVerifyPage) {
            if (isNewAccount) {
              LocalStorage.removeItem(LS.IS_NEW_ACCOUNT);
              window.location.assign(`/$/${PAGES.AUTH}`);
            } else {
              window.location.assign('/');
            }
          } else {
            window.location.reload();
          }
        }
        break;

      default:
        break; // skip
    }
    // @endif

    return next(action);
  };
};
