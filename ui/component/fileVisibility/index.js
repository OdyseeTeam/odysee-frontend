import { connect } from 'react-redux';
import FileVisibility from './view';

import { AGE_RESTRICED_CONTENT_TAG } from 'constants/tags';

import { selectIsUriUnlisted, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';

const select = (state, props) => {
  return {
    isUnlisted: selectIsUriUnlisted(state, props.uri),
    isAgeRestricted: makeSelectTagInClaimOrChannelForUri(props.uri, AGE_RESTRICED_CONTENT_TAG)(state),
  };
};

export default connect(select)(FileVisibility);
