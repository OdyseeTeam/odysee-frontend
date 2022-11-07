import { connect } from 'react-redux';
import { getClaimMetadata } from 'util/claim';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doResolveClaimId } from 'redux/actions/claims';
import FeaturedSection from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const metadata = getClaimMetadata(claim);
  const description = metadata && metadata.description;
  return {
    claim,
    description,
  };
};

const perform = {
  doResolveClaimId,
};

export default connect(select, perform)(FeaturedSection);
