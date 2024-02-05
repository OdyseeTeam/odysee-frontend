import { connect } from 'react-redux';
import {
  selectMyChannelClaimUrls,
  selectFetchingMyChannels,
  selectFetchingMyChannelsSuccess,
  selectIsFetchingClaimListMine,
  selectIsFetchingClaimListMineSuccess,
  selectMyClaimsPageItemCount,
} from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';
import {
  selectTotalBalance,
  selectIsFetchingAccounts,
  selectIsWalletMerged,
  selectIsFetchingAccountsSuccess,
} from 'redux/selectors/wallet';
import { doFetchAccountList } from 'redux/actions/wallet';
import { selectUser, selectHasYoutubeChannels } from 'redux/selectors/user';
import { doFetchChannelListMine, doFetchClaimListMine } from 'redux/actions/claims';
import { doRemoveAccountSequence } from './thunk';
import ModalRemoveAccount from './view';

const select = (state) => ({
  isPendingDeletion: selectUser(state)?.pending_deletion,
  hasYouTubeChannels: selectHasYoutubeChannels(state),
  totalBalance: selectTotalBalance(state),
  totalClaimsCount: selectMyClaimsPageItemCount(state),
  channelUrls: selectMyChannelClaimUrls(state),
  isFetchingChannels: selectFetchingMyChannels(state),
  isFetchingChannelsSuccess: selectFetchingMyChannelsSuccess(state),
  isFetchingClaims: selectIsFetchingClaimListMine(state),
  isFetchingClaimsSuccess: selectIsFetchingClaimListMineSuccess(state),
  isFetchingAccounts: selectIsFetchingAccounts(state),
  isFetchingAccountsSuccess: selectIsFetchingAccountsSuccess(state),
  isWalletMerged: selectIsWalletMerged(state),
});

const perform = {
  doHideModal,
  doRemoveAccountSequence,
  doFetchChannelListMine,
  doFetchClaimListMine,
  doFetchAccountList,
};

export default connect(select, perform)(ModalRemoveAccount);
