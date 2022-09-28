import { connect } from 'react-redux';
import { selectClaimIsMine, selectClaimForUri } from 'redux/selectors/claims';
import {
  makeSelectFileInfoForUri,
  makeSelectDownloadingForUri,
  makeSelectLoadingForUri,
  selectStreamingUrlForUri,
} from 'redux/selectors/file_info';
import { selectCostInfoForUri } from 'lbryinc';
import { doOpenModal } from 'redux/actions/app';
import { doClearPlayingUri, doDownloadUri } from 'redux/actions/content';
import FileDownloadLink from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    fileInfo: makeSelectFileInfoForUri(props.uri)(state),
    downloading: makeSelectDownloadingForUri(props.uri)(state),
    loading: makeSelectLoadingForUri(props.uri)(state),
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
    costInfo: selectCostInfoForUri(state, props.uri),
    streamingUrl: selectStreamingUrlForUri(state, props.uri),
  };
};

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  pause: () => dispatch(doClearPlayingUri()),
  download: (uri) => dispatch(doDownloadUri(uri)),
});

export default connect(select, perform)(FileDownloadLink);
