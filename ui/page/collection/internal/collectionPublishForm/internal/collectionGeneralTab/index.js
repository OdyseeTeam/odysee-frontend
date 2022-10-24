import { connect } from 'react-redux';

import { selectHasClaimForId, selectNameForClaimId } from 'redux/selectors/claims';

import CollectionGeneralTab from './view';

const select = (state, props) => {
  const { collectionId, formParams } = props;
  const { channel_id: collectionChannelId } = formParams;

  return {
    hasClaim: selectHasClaimForId(state, collectionId),
    collectionChannelName: selectNameForClaimId(state, collectionChannelId),
  };
};

export default connect(select)(CollectionGeneralTab);
