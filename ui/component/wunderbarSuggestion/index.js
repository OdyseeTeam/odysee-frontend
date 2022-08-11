import { connect } from 'react-redux';
import { selectClaimForUri, selectGeoRestrictionForUri, selectIsUriResolving } from 'redux/selectors/claims';
import { selectOdyseeMembershipForChannelId } from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';
import WunderbarSuggestion from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    claim,
    odyseePremium: selectOdyseeMembershipForChannelId(state, getChannelIdFromClaim(claim)),
    isResolvingUri: selectIsUriResolving(state, uri),
    geoRestriction: selectGeoRestrictionForUri(state, props.uri),
  };
};

export default connect(select)(WunderbarSuggestion);
