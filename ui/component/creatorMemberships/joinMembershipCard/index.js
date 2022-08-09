// import { connect } from 'react-redux';
// import { withRouter } from 'react-router';
// import JoinMembershipCard from './view';
//
// export default withRouter(connect()(JoinMembershipCard));
//
//
import { connect } from 'react-redux';
import {selectChannelNameForUri, selectChannelIdForUri } from 'redux/selectors/claims';
import JoinMembershipCard from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    channelId: selectChannelIdForUri(state, uri),
  };
};

const perform = {

};

export default connect(select, perform)(JoinMembershipCard);
