import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import CollectionAddButton from './view';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectClaimInCollectionsForUrl } from 'redux/selectors/collections';

const select = (state, props) => {
  const { uri } = props;

  const { permanent_url: permanentUrl, value } = selectClaimForUri(state, uri) || {};
  const { stream_type: streamType } = value || {};

  return {
    streamType,
    isSaved: permanentUrl && selectClaimInCollectionsForUrl(state, permanentUrl),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(CollectionAddButton);
