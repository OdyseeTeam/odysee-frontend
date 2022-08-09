import { connect } from 'react-redux';
import { makeSelectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import PublishProtectedContent from './view';

const select = (state) => ({

});

const perform = (dispatch) => ({
  
});

export default connect(select, perform)(PublishProtectedContent);
