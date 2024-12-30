import { connect } from 'react-redux';

import { doUpdateFile } from 'redux/actions/publish';
import { selectPublishFormValue } from 'redux/selectors/publish';

import { selectModal } from 'redux/selectors/app';
import { doOpenModal } from 'redux/actions/app';

import FileDrop from './view';

const select = (state) => ({
  modal: selectModal(state),
  filePath: selectPublishFormValue(state, 'filePath'),
});

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  doUpdateFile: (file, clearName) => dispatch(doUpdateFile(file, clearName)),
});

export default connect(select, perform)(FileDrop);
