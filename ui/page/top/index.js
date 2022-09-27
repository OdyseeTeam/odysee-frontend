import { connect } from 'react-redux';
import TopPage from './view';
// import { doClearPublish, doPrepareEdit } from 'redux/actions/publish';
import { doClearPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
import { push } from 'connected-react-router';
import * as PAGES from 'constants/pages';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const name = urlParams.get('name');

  return {
    name,
  };
};

const perform = (dispatch) => ({
  beginPublish: (name) => {
    dispatch(doClearPublish());
    // dispatch(doPrepareEdit({ name }));
    dispatch(push(`/$/${PAGES.UPLOAD}`));
  },
  doOpenModal: (id, props) => dispatch(doOpenModal(id, props)),
});

export default connect(select, perform)(TopPage);
