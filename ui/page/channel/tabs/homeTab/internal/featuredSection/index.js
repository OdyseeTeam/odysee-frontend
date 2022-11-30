import { connect } from 'react-redux';
import { getClaimMetadata } from 'util/claim';
import { selectClaimForUri, selectGeoRestrictionForUri } from 'redux/selectors/claims';
import { doResolveClaimId } from 'redux/actions/claims';
import FeaturedSection from './view';
import { doFetchViewCount } from 'lbryinc';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const metadata = getClaimMetadata(claim);
  const description = metadata && metadata.description;
  const geoRestriction = Boolean(selectGeoRestrictionForUri(state, props.uri));

  return {
    claim,
    description,
    geoRestriction,
  };
};

const perform = {
  doResolveClaimId,
  doFetchViewCount,
};

export default connect(select, perform)(FeaturedSection);
