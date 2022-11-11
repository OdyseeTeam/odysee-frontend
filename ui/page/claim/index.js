import { connect } from 'react-redux';

import { selectIsMarkdownPostForUri } from 'redux/selectors/content';
import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';

import ClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    isMarkdownPost: selectIsMarkdownPostForUri(state, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
  };
};

export default connect(select)(ClaimPage);
