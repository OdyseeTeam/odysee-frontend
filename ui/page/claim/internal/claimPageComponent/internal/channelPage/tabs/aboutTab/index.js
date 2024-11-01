import { connect } from 'react-redux';
import { makeSelectMetadataItemForUri, makeSelectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { selectUser } from 'redux/selectors/user';

import AboutTab from './view';

const select = (state, props) => {
  const claim = makeSelectClaimForUri(props.uri)(state);

  return {
    claim,
    description: makeSelectMetadataItemForUri(props.uri, 'description')(state),
    website: makeSelectMetadataItemForUri(props.uri, 'website_url')(state),
    email: makeSelectMetadataItemForUri(props.uri, 'email')(state),
    languages: makeSelectMetadataItemForUri(props.uri, 'languages')(state),
    user: selectUser(state),
    claimIsMine: selectClaimIsMine(state, claim),
  };
};

export default connect(select, null)(AboutTab);
