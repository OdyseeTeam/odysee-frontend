import { connect } from 'react-redux';
import { selectClaimNameForId } from 'redux/selectors/claims';

import CollectionGeneralTab from './view';

const select = (state, props) => {
  const { params } = props;
  const { channel_id: collectionChannelId } = params;

  return {
    collectionChannelName: selectClaimNameForId(state, collectionChannelId),
  };
};

export default connect(select)(CollectionGeneralTab);
