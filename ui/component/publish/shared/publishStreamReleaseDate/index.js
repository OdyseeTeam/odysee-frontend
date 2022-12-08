import { connect } from 'react-redux';
import { selectPublishFormValue, selectIsScheduled } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import PublishStreamReleaseDate from './view';

const select = (state) => ({
  isScheduled: selectIsScheduled(state),
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
  publishVisibility: selectPublishFormValue(state, 'visibility'),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishStreamReleaseDate);
