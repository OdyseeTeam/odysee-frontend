import { connect } from 'react-redux';
import { selectClaimIsMineForUri, selectClaimHasSupportsForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import ClaimSupportsLiquidateButton from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claimIsMine: selectClaimIsMineForUri(state, uri),
    hasSupport: selectClaimHasSupportsForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ClaimSupportsLiquidateButton);
