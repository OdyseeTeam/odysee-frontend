import { connect } from 'react-redux';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectPermanentUrlForUri, selectChannelForClaimUri } from 'redux/selectors/claims';
import { doChannelSubscribe, doChannelUnsubscribe } from 'redux/actions/subscriptions';
import MobileActions from './view';

const select = (state, props) => {
  const channelUrl = props.uri ? selectChannelForClaimUri(state, props.uri, true) : undefined;
  return {
    channelUrl,
    isSubscribed: channelUrl ? selectIsSubscribedForUri(state, channelUrl) : false,
    channelPermanentUrl: channelUrl ? selectPermanentUrlForUri(state, channelUrl) : undefined,
  };
};

const perform = {
  doChannelSubscribe,
  doChannelUnsubscribe,
};
export default connect(select, perform)(MobileActions);
