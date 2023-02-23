import { connect } from 'react-redux';
import { normalizeURI } from 'util/lbryURI';
import { selectIsUriResolving, selectClaimForUri } from 'redux/selectors/claims';
import { selectOdyseeMembershipForChannelId } from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';
import UriIndicator from './view';

const select = (state, props) => {
  let uri = null;
  try {
    uri = normalizeURI(props.uri);
  } catch {}

  const claim = selectClaimForUri(state, props.uri);

  return {
    claim,
    odyseeMembership: selectOdyseeMembershipForChannelId(state, getChannelIdFromClaim(claim)),
    isResolvingUri: selectIsUriResolving(state, props.uri),
    uri,
  };
};

export default connect(select)(UriIndicator);
