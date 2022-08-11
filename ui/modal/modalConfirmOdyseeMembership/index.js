import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doMembershipBuy, doMembershipMine } from 'redux/actions/memberships';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { doToast } from 'redux/actions/notifications';

import ModalConfirmOdyseeMembership from './view';

const select = (state) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  channels: selectMyChannelClaims(state),
  incognito: selectIncognito(state),
  preferredCurrency: selectPreferredCurrency(state),
});

const perform = {
  doHideModal,
  doMembershipBuy,
  doToast,
  doMembershipMine,
};

export default connect(select, perform)(ModalConfirmOdyseeMembership);
