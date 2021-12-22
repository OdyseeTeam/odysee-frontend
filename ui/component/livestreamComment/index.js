import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectMyClaimIdsRaw,
  selectClaimsByUri,
} from 'redux/selectors/claims';
import { doFetchUserMemberships } from 'redux/actions/user';
import { selectOdyseeMembershipByClaimId } from 'redux/selectors/user';
import LivestreamComment from './view';

const select = (state, props) => {
  const { uri, comment } = props;
  const { channel_url: authorUri } = comment;

  return {
    claim: selectClaimForUri(state, uri),
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    myChannelIds: selectMyClaimIdsRaw(state),
    claimsByUri: selectClaimsByUri(state),
    selectOdyseeMembershipByClaimId: selectOdyseeMembershipByClaimId(state, authorUri),
  };
};

const perform = {
  doFetchUserMemberships,
};

export default connect(select, perform)(LivestreamComment);
