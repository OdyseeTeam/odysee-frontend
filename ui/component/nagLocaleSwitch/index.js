import { connect } from 'react-redux';
import { doSetLanguage, doSetHomepage } from 'redux/actions/settings';
import { doOpenModal } from 'redux/actions/app';
import NagContinueFirstRun from './view';

const perform = {
  doSetLanguage,
  doSetHomepage,
  doOpenModal,
};

export default connect(null, perform)(NagContinueFirstRun);
