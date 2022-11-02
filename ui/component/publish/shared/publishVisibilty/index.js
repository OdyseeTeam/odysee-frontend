import { connect } from 'react-redux';
import { selectUnlistedContentTag, selectPrivateContentTag } from 'redux/selectors/claims';
import { doUpdatePublishForm } from 'redux/actions/publish';
import PublishVisibility from './view';

const select = (state, props) => ({
  isUnlistedContent: Boolean(selectUnlistedContentTag(state, props.uri)),
  isPrivateContent: Boolean(selectPrivateContentTag(state, props.uri)),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishVisibility);
