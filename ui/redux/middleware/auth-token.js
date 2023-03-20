import * as ACTIONS from 'constants/action_types';
import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
import Lbry from 'lbry';
import { getAuthToken } from 'util/saved-passwords';
import { selectClientSetting } from 'redux/selectors/settings';

export const populateAuthTokenHeader = ({ getState, dispatch }) => {
  return (next) => (action) => {
    // @if TARGET='web'

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
        const state = getState();
        const isNewAccount = selectClientSetting(state, SETTINGS.IS_NEW_ACCOUNT);
        const xAuth = (Lbry.getApiRequestHeaders() || {})[X_LBRY_AUTH_TOKEN] || '';
        if (!xAuth) {
          if (location.href.includes(PAGES.AUTH_VERIFY) && !location.href.includes(PAGES.REWARDS_VERIFY)) {
            if (isNewAccount) {
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
