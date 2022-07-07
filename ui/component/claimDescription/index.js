import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import ClaimDescription from './view';
import { getClaimMetadata } from 'util/claim';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const metadata = getClaimMetadata(claim);

  return {
    description: metadata && metadata.description,
  };
};

export default connect(select)(ClaimDescription);
