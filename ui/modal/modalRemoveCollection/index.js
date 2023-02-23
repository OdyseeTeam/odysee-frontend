import { connect } from 'react-redux';
import { selectHasClaimForId } from 'redux/selectors/claims';
import { doCollectionDelete } from 'redux/actions/collections';
import {
  selectCollectionTitleForId,
  selectCollectionKeyForId,
  selectCollectionIsMine,
} from 'redux/selectors/collections';
import { doHideModal } from 'redux/actions/app';
import ModalRemoveCollection from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    hasClaim: selectHasClaimForId(state, collectionId),
    collectionIsMine: selectCollectionIsMine(state, collectionId),
    collectionName: selectCollectionTitleForId(state, collectionId),
    collectionKey: selectCollectionKeyForId(state, collectionId),
  };
};

const perform = {
  doHideModal,
  doCollectionDelete,
};

export default connect(select, perform)(ModalRemoveCollection);
