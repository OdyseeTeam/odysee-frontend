import { connect } from 'react-redux';
import { getClaimMetadata } from 'util/claim';
import { selectClaimForUri } from 'redux/selectors/claims';
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

export default connect(select)(FeaturedSection);
