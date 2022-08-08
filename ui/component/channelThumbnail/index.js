import { connect } from 'react-redux';
import {
  selectThumbnailForUri,
  selectClaimForUri,
  selectIsUriResolving,
  selectClaimsByUri,
} from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import { doFetchOdyseeMembershipsById } from 'redux/actions/memberships';
import ChannelThumbnail from './view';

const select = (state, props) => ({
  thumbnail: selectThumbnailForUri(state, props.uri),
  claim: selectClaimForUri(state, props.uri),
  isResolving: selectIsUriResolving(state, props.uri),
  claimsByUri: selectClaimsByUri(state),
});

export default connect(select, {
  doResolveUri,
  doFetchOdyseeMembershipsById,
})(ChannelThumbnail);
