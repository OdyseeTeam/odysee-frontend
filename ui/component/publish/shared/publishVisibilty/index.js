import { connect } from 'react-redux';
import { makeSelectReflectingClaimForUri } from 'redux/selectors/claims';
import { doUpdatePublishForm } from 'redux/actions/publish';
import PublishVisibility from './view';

const select = (state, props) => ({
  reflectingInfo: props.uri && makeSelectReflectingClaimForUri(props.uri)(state),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishVisibility);
