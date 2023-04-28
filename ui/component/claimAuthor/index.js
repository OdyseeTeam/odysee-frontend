// @flow
import { connect } from 'react-redux';
import { selectChannelForClaimUri } from 'redux/selectors/claims';
import type { Props } from './view';
import ClaimAuthor from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelUri: selectChannelForClaimUri(state, uri),
  };
};

export default connect<_, Props, _, _, _, _>(select, {})(ClaimAuthor);
