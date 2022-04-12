import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import MembershipsPage from './view';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectClaimsById, selectMyChannelClaims, selectClaimsByUri } from 'redux/selectors/claims';
import { selectUser, selectUserLocale } from 'redux/selectors/user';
import { doToast } from 'redux/actions/notifications';
import { doResolveClaimIds } from 'redux/actions/claims';

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
  };
};

const perform = (dispatch) => ({
  doResolveClaimIds: (claimIds) => dispatch(doResolveClaimIds(claimIds)),
  doToast: (options) => dispatch(doToast(options)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(MembershipsPage);
