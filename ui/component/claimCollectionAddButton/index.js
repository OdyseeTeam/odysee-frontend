import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import CollectionAddButton from './view';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectClaimSavedForUrl } from 'redux/selectors/collections';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { permanent_url: permanentUrl } = claim || {};

  return {
    claim,
    uri: permanentUrl,
    isSaved: permanentUrl && selectClaimSavedForUrl(state, permanentUrl),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(CollectionAddButton);
