import { connect } from 'react-redux';
import { selectHasChannels } from 'redux/selectors/claims';
import { selectWalletIsEncrypted } from 'redux/selectors/wallet';
import { doSignOut } from 'redux/actions/app';
import { doClearEmailEntry, doClearPasswordEntry } from 'redux/actions/user';
import { doWalletStatus } from 'redux/actions/wallet';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';

import SettingAccount from './view';

const select = (state) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  walletEncrypted: selectWalletIsEncrypted(state),
  user: selectUser(state),
  hasChannels: selectHasChannels(state),
});

const perform = {
  doWalletStatus,
  doClearPasswordEntry,
  doClearEmailEntry,
  doSignOut,
};

export default connect(select, perform)(SettingAccount);
