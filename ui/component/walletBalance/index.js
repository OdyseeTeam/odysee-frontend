import { connect } from 'react-redux';
import { selectUserExperimentalUi } from 'redux/selectors/user';
import {
  selectBalance,
  selectTotalBalance,
  selectClaimsBalance,
  selectSupportsBalance,
  selectTipsBalance,
  selectIsFetchingUtxoCounts,
  selectUtxoCounts,
  selectIsConsolidatingUtxos,
  selectIsMassClaimingTips,
  selectPendingConsolidateTxid,
  selectPendingMassClaimTxid,
} from 'redux/selectors/wallet';
import { doArConnect, doArDisconnect } from 'redux/actions/arwallet';
import {
  selectArweaveStatus,
  selectArweaveBalance,
  selectArweaveExchangeRates,
  selectArweaveWanderAuth,
} from 'redux/selectors/arwallet';
import { selectFullAPIArweaveStatus } from 'redux/selectors/stripe';
import { doFetchUtxoCounts, doUtxoConsolidate } from 'redux/actions/wallet';
import { doOpenModal } from 'redux/actions/app';
import { selectSyncHash } from 'redux/selectors/sync';
import { selectClaimedRewards } from 'redux/selectors/rewards';
import { selectClientSettings } from 'redux/selectors/settings';
import WalletBalance from './view';

const select = (state) => ({
  clientSettings: selectClientSettings(state),
  experimentalUi: selectUserExperimentalUi(state),
  LBCBalance: selectBalance(state),
  arStatus: selectArweaveStatus(state),
  arBalance: selectArweaveBalance(state)?.ar,
  arUsdRate: selectArweaveExchangeRates(state)?.ar,
  fullArweaveStatus: selectFullAPIArweaveStatus(state),
  claimsBalance: selectClaimsBalance(state) || 0,
  totalBalance: selectTotalBalance(state),
  supportsBalance: selectSupportsBalance(state) || 0,
  tipsBalance: selectTipsBalance(state) || 0,
  rewards: selectClaimedRewards(state),
  hasSynced: Boolean(selectSyncHash(state)),
  fetchingUtxoCounts: selectIsFetchingUtxoCounts(state),
  consolidatingUtxos: selectIsConsolidatingUtxos(state),
  massClaimingTips: selectIsMassClaimingTips(state),
  utxoCounts: selectUtxoCounts(state),
  consolidateIsPending: selectPendingConsolidateTxid(state),
  massClaimIsPending: selectPendingMassClaimTxid(state),
  arweaveAccountStatus: selectFullAPIArweaveStatus(state),
  wanderAuth: selectArweaveWanderAuth(state),
});

export default connect(select, {
  doOpenModal,
  doFetchUtxoCounts,
  doUtxoConsolidate,
  doArConnect,
  doArDisconnect,
})(WalletBalance);
