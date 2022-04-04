import { connect } from 'react-redux';
import { selectHasChannels } from 'redux/selectors/claims';
import { doWalletStatus } from 'redux/actions/wallet';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';

import SettingAccount from './view';

const select = (state) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  user: selectUser(state),
  hasChannels: selectHasChannels(state),
});

const perform = (dispatch) => ({
  doWalletStatus: () => dispatch(doWalletStatus()),
});

export default connect(select, perform)(SettingAccount);
