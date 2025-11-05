import { connect } from 'react-redux';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import SwipeNavigationPortal from './view';
import { selectClaimForUri } from 'redux/selectors/claims';

const select = (state, ownProps) => {
  const claim = ownProps?.uri ? selectClaimForUri(state, ownProps.uri) : null;
  const channel = claim?.signing_channel || null;

  return {
    channelName: channel?.name || '',
    channelUri: channel?.canonical_url || channel?.permanent_url || '',
    hasChannel: !!channel,
    hasPlaylist: false,
  };
};

const perform = {};

export default connect(select, perform)(withStreamClaimRender(SwipeNavigationPortal));
