import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectClaimForUri } from 'redux/selectors/claims';
import ModalJoinMembership from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
  };
};

const perform = {
  doHideModal,
};

export default connect(select, perform)(ModalJoinMembership);
