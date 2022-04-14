import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectClaimsById, selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { selectUser, selectUserLocale } from 'redux/selectors/user';
import { selectBankAccountConfirmed } from 'redux/selectors/stripe';
import { doToast } from 'redux/actions/notifications';
import { doResolveClaimIds } from 'redux/actions/claims';
import { doTipAccountStatus } from 'redux/actions/stripe';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    activeChannelClaim,
    channels: selectMyChannelClaims(state),
    claimsByUri: selectClaimsByUri(state),
    incognito: selectIncognito(state),
    user: selectUser(state),
    locale: selectUserLocale(state),
    claimsById: selectClaimsById(state),
    bankAccountConfirmed: selectBankAccountConfirmed(state),
  };
};

const perform = {
  doResolveClaimIds,
  doToast,
  doOpenModal,
  doTipAccountStatus,
};

export default connect(select, perform)(MembershipsPage);
