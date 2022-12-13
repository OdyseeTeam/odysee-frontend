import { connect } from 'react-redux';
import { selectClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';
import { selectHyperChatsForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import LivestreamLayout from './view';
import { selectViewersForId } from 'redux/selectors/livestream';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;

  return {
    activeViewers: claimId && selectViewersForId(state, claimId),
    chatDisabled: selectCommentsDisabledSettingForChannelId(uri, getChannelIdFromClaim(claim)),
    claim,
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    superChats: selectHyperChatsForUri(state, uri),
    thumbnail: selectThumbnailForUri(state, uri),
  };
};

export default connect(select)(LivestreamLayout);
