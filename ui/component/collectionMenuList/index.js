import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doToggleShuffleList } from 'redux/actions/content';
import { selectListShuffle } from 'redux/selectors/content';
import CollectionMenuList from './view';

const select = (state, props) => ({
  shuffleList: selectListShuffle(state),
});

const perform = {
  doToggleShuffleList,
  doOpenModal,
};

export default connect(select, perform)(CollectionMenuList);
