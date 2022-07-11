import { connect } from 'react-redux';
import { selectChannelForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';

import CollectionGeneralTab from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    collectionChannel: selectChannelForUri(state, uri),
    activeChannelClaim: selectActiveChannelClaim(state),
  };
};

export default connect(select)(CollectionGeneralTab);
