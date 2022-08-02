import { connect } from 'react-redux';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { doSetDefaultChannel } from 'redux/actions/settings';
import { selectDefaultChannelClaim } from 'redux/selectors/settings';
import ChannelSelector from './view';

const select = (state, props) => {
  const { storeSelection } = props;
  const activeChannelClaim = selectActiveChannelClaim(state);
  const defaultChannelClaim = selectDefaultChannelClaim(state);

  return {
    channels: selectMyChannelClaims(state),
    activeChannelClaim: storeSelection ? defaultChannelClaim : activeChannelClaim,
    incognito: selectIncognito(state),
  };
};

const perform = {
  doSetActiveChannel,
  doSetIncognito,
  doFetchOdyseeMembershipForChannelIds,
  doSetDefaultChannel,
};

export default connect(select, perform)(ChannelSelector);
