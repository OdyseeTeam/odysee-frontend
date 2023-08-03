import { connect } from 'react-redux';
import FileVisibility from './view';

import { selectIsUriUnlisted } from 'redux/selectors/claims';

const select = (state, props) => {
  return {
    isUnlisted: selectIsUriUnlisted(state, props.uri),
  };
};

export default connect(select)(FileVisibility);
