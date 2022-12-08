import { connect } from 'react-redux';
import { selectUnlistedContentTag, selectPrivateContentTag } from 'redux/selectors/claims';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectPublishFormValue } from 'redux/selectors/publish';
import PublishVisibility from './view';

const select = (state, props) => ({
  isUnlistedContent: Boolean(selectUnlistedContentTag(state, props.uri)),
  isPrivateContent: Boolean(selectPrivateContentTag(state, props.uri)),
  editedReleaseTime: selectPublishFormValue(state, 'releaseTimeEdited'),
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishVisibility);
