import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doMembershipBuy } from 'redux/actions/memberships';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaimsList } from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';

import ModalConfirmOdyseeMembership from './view';

const select = (state) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  channels: selectMyChannelClaimsList(state),
  incognito: selectIncognito(state),
  preferredCurrency: selectPreferredCurrency(state),
});

const perform = {
  doHideModal,
  doMembershipBuy,
};

export default connect(select, perform)(ModalConfirmOdyseeMembership);
