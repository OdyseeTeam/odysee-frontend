import { connect } from 'react-redux';
import { selectClaimUriForId } from 'redux/selectors/claims';

import ChannelListItem from './view';

const select = (state, props) => {
  const { channelId } = props;

  return {
    uri: selectClaimUriForId(state, channelId),
  };
};

export default connect(select)(ChannelListItem);
