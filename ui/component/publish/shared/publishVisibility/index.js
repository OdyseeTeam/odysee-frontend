import { connect } from 'react-redux';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectIsNonPublicVisibilityAllowed, selectPublishFormValue } from 'redux/selectors/publish';
import PublishVisibility from './view';

const select = (state, props) => ({
  visibility: selectPublishFormValue(state, 'visibility'),
  scheduledShow: selectPublishFormValue(state, 'scheduledShow'),
  claimToEdit: selectPublishFormValue(state, 'claimToEdit'),
  isNonPublicAllowed: selectIsNonPublicVisibilityAllowed(state),
});

const perform = {
  doUpdatePublishForm,
};

export default connect(select, perform)(PublishVisibility);
