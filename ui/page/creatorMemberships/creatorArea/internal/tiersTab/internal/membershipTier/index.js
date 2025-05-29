import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doDeactivateMembershipForId, doMembershipList } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';
import { selectArweaveExchangeRates } from 'redux/selectors/arwallet';
import TiersTab from './view';


const select = (state, props) => {
  return {
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doOpenModal,
  doToast,
  doDeactivateMembershipForId,
  doMembershipList,
};

export default connect(select, perform)(TiersTab);
