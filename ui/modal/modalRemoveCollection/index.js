import { connect } from 'react-redux';
import { selectHasClaimForClaimId } from 'redux/selectors/claims';
import { doCollectionDelete } from 'redux/actions/collections';
import {
  selectTitleForCollectionId,
  selectCollectionKeyForId,
  selectCollectionIsMineForId,
} from 'redux/selectors/collections';
import { doHideModal } from 'redux/actions/app';
import ModalRemoveCollection from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    hasClaim: selectHasClaimForClaimId(state, collectionId),
    collectionIsMine: selectCollectionIsMineForId(state, collectionId),
    collectionName: selectTitleForCollectionId(state, collectionId),
    collectionKey: selectCollectionKeyForId(state, collectionId),
  };
};

const perform = {
  doHideModal,
  doCollectionDelete,
};

export default connect(select, perform)(ModalRemoveCollection);
