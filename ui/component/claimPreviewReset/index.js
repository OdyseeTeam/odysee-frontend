import { connect } from 'react-redux';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimIsMineForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import ClaimPreviewReset from './view';

const select = (state, props) => {
  const { uri } = props;

  const { claim_id: channelId, name: channelName } = selectActiveChannelClaim(state) || {};

  return {
    channelName,
    channelId,
    claimIsMine: uri && selectClaimIsMineForUri(state, uri),
    isCurrentClaimLive: selectIsActiveLivestreamForUri(state, uri),
  };
};

const perform = {
  doToast,
};

export default connect(select, perform)(ClaimPreviewReset);
