import { connect } from 'react-redux';
import { doPlayUri, doSetPlayingUri } from 'redux/actions/content';
import { selectInsufficientCreditsForUri, selectPlayingUri } from 'redux/selectors/content';
import { doHideModal, doAnaltyicsPurchaseEvent } from 'redux/actions/app';
import { makeSelectMetadataForUri } from 'redux/selectors/claims';
import ModalAffirmPurchase from './view';

const select = (state, props) => ({
  isInsufficientCredits: selectInsufficientCreditsForUri(state, props.uri),
  metadata: makeSelectMetadataForUri(props.uri)(state),
  playingUri: selectPlayingUri(state),
});

const perform = (dispatch) => ({
  analyticsPurchaseEvent: (fileInfo) => dispatch(doAnaltyicsPurchaseEvent(fileInfo)),
  setPlayingUri: (params) => dispatch(doSetPlayingUri(params)),
  closeModal: () => dispatch(doHideModal()),
  loadVideo: (uri, onSuccess) => dispatch(doPlayUri(uri, true, undefined, onSuccess)),
});

export default connect(select, perform)(ModalAffirmPurchase);
