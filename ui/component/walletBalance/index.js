import { connect } from 'react-redux';
import { selectUserExperimentalUi } from 'redux/selectors/user';
import {
  selectBalance,
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
import { selectArweaveBalance } from 'redux/selectors/arwallet';
import { selectAccountStatus, selectArweaveStatus } from 'redux/selectors/stripe';
import { doFetchUtxoCounts, doUtxoConsolidate } from 'redux/actions/wallet';
import { doOpenModal } from 'redux/actions/app';
import { selectSyncHash } from 'redux/selectors/sync';
import { selectClaimedRewards } from 'redux/selectors/rewards';
import WalletBalance from './view';

const select = (state) => ({
  experimentalUi: selectUserExperimentalUi(state),
  LBCBalance: selectBalance(state),
  USDCBalance: selectArweaveBalance(state).usdc,
  accountStatus: selectAccountStatus(state),
  arweaveStatus: selectArweaveStatus(state),
  claimsBalance: selectClaimsBalance(state) || 0,
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
});

export default connect(select, {
  doOpenModal,
  doFetchUtxoCounts,
  doUtxoConsolidate,
})(WalletBalance);
