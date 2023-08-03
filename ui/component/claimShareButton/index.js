import { connect } from 'react-redux';
import ClaimShareButton from './view';

import { doOpenModal } from 'redux/actions/app';
import { selectClaimIsMineForUri, selectIsUriUnlisted } from 'redux/selectors/claims';

const select = (state, props) => {
  return {
    isClaimMine: selectClaimIsMineForUri(state, props.uri),
    isUnlisted: selectIsUriUnlisted(state, props.uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ClaimShareButton);
