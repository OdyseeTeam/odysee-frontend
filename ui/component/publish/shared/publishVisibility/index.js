import { connect } from 'react-redux';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectPublishFormValue } from 'redux/selectors/publish';
import PublishVisibility from './view';

const select = (state, props) => ({
  visibility: selectPublishFormValue(state, 'visibility'),
});

const perform = {
  doUpdatePublishForm,
};

export default connect(select, perform)(PublishVisibility);
