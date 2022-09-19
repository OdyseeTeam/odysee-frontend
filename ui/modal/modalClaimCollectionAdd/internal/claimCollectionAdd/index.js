import { connect } from 'react-redux';
import ClaimCollectionAdd from './view';
import { selectMyUnpublishedCollections } from 'redux/selectors/collections';
import { selectMyCollectionClaimsById } from 'redux/selectors/claims';

const select = (state, props) => ({
  published: selectMyCollectionClaimsById(state),
  unpublished: selectMyUnpublishedCollections(state),
});

export default connect(select)(ClaimCollectionAdd);
