import { connect } from 'react-redux';
import TopPage from './view';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const name = urlParams.get('name');

  return {
    name,
  };
};

const perform = (dispatch) => ({
  beginPublish: (a, b, c) => dispatch(doBeginPublish(a, b, c)),
  doOpenModal: (id, props) => dispatch(doOpenModal(id, props)),
});

export default connect(select, perform)(TopPage);
