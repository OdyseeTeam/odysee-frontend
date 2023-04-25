import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectClaimForUri, selectClaimRepostedAmountForUri } from 'redux/selectors/claims';
import ClaimRepostButton from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
    repostedAmount: selectClaimRepostedAmountForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ClaimRepostButton);
