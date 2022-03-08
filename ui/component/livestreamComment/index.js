import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectMyClaimIdsRaw,
  selectClaimsByUri,
  selectOdyseeMembershipForUri
} from 'redux/selectors/claims';

import LivestreamComment from './view';

const select = (state, props) => {
  const { uri, comment } = props;
  const { channel_url: authorUri } = comment;

  return {
    claim: selectClaimForUri(state, uri),
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    myChannelIds: selectMyClaimIdsRaw(state),
    claimsByUri: selectClaimsByUri(state),
    odyseeMembership: selectOdyseeMembershipForUri(state, authorUri),
  };
};

const perform = {};

export default connect(select, perform)(LivestreamComment);
