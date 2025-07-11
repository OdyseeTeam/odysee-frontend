import { connect } from 'react-redux';
import { doClearEmailEntry, doClearPasswordEntry } from 'redux/actions/user';
import { doSignOut, doOpenModal } from 'redux/actions/app';
import { doClearClaimSearch } from 'redux/actions/claims';
import { doRemoveFromUnsavedChangesCollectionsForCollectionId } from 'redux/actions/collections';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectGetSyncErrorMessage, selectPrefsReady } from 'redux/selectors/sync';
import { selectHasNavigated } from 'redux/selectors/app';
import { selectTotalBalance, selectBalance } from 'redux/selectors/wallet';
import { selectUserVerifiedEmail, selectEmailToVerify, selectUser } from 'redux/selectors/user';
import { selectAPIArweaveActiveAccounts } from 'redux/selectors/stripe';
import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import Header from './view';

const select = (state) => ({
  authenticated: selectUserVerifiedEmail(state),
  balance: selectBalance(state),
  emailToVerify: selectEmailToVerify(state),
  hasNavigated: selectHasNavigated(state),
  hideBalance: selectClientSetting(state, SETTINGS.HIDE_BALANCE),
  totalBalance: selectTotalBalance(state),
  syncError: selectGetSyncErrorMessage(state),
  user: selectUser(state),
  prefsReady: selectPrefsReady(state),
  arweaveAccounts: selectAPIArweaveActiveAccounts(state),
});

const perform = (dispatch) => ({
  doClearClaimSearch: () => dispatch(doClearClaimSearch()),
  doRemoveFromUnsavedChangesCollectionsForCollectionId: (collectionId) => dispatch(doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId)),
  clearEmailEntry: () => dispatch(doClearEmailEntry()),
  clearPasswordEntry: () => dispatch(doClearPasswordEntry()),
  signOut: () => dispatch(doSignOut()),
  openChangelog: (modalProps) => dispatch(doOpenModal(MODALS.CONFIRM, modalProps)),
});

export default connect(select, perform)(Header);
