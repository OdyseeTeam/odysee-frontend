import { connect } from 'react-redux';
import { doDeleteStreamClaim } from 'redux/actions/file';
import { doHideModal } from 'redux/actions/app';
import { doResolveUri } from 'redux/actions/claims';
import { selectClaimForUri, makeSelectIsAbandoningClaimForUri } from 'redux/selectors/claims';
import ModalRemoveFile from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
    isAbandoning: makeSelectIsAbandoningClaimForUri(uri)(state),
  };
};

const perform = {
  doHideModal,
  doDeleteStreamClaim,
  doResolveUri,
};

export default connect(select, perform)(ModalRemoveFile);
