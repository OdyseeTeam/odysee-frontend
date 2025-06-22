import { connect } from 'react-redux';
import {
  selectThumbnailForUri,
  selectClaimForUri,
  selectIsUriResolving,
  selectClaimsByUri,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimIsMine,
} from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import { selectOdyseeMembershipForChannelId } from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';
import { selectIsAgeRestrictedContentAllowed } from 'redux/selectors/settings';
import { AGE_RESTRICED_CHANNEL_IMAGES_TAG } from 'constants/tags';
import ChannelThumbnail from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    thumbnail: selectThumbnailForUri(state, uri),
    claim,
    isResolving: selectIsUriResolving(state, uri),
    claimsByUri: selectClaimsByUri(state),
    odyseeMembership: selectOdyseeMembershipForChannelId(state, getChannelIdFromClaim(claim)),
    isImagesAgeRestricted: makeSelectTagInClaimOrChannelForUri(props.uri, AGE_RESTRICED_CHANNEL_IMAGES_TAG)(state),
    channelIsMine: selectClaimIsMine(state, claim),
    isAgeRestrictedContentAllowed: selectIsAgeRestrictedContentAllowed(state),
  };
};

const perform = {
  doResolveUri,
};

export default connect(select, perform)(ChannelThumbnail);
