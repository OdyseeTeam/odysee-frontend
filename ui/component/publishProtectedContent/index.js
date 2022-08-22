import { connect } from 'react-redux';
import { makeSelectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import PublishProtectedContent from './view';

const select = (state) => ({
  activeChannel: selectActiveChannelClaim(state),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishProtectedContent);
