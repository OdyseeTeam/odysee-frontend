import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { makeSelectTagInClaimOrChannelForUri, selectClaimForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import ClaimSupportButton from './view';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';

const DISABLE_SUPPORT_TAG = 'disable-support';
const DISABLED_SUPPORT = process.env.DISABLED_SUPPORT_CHANNELS ? process.env.DISABLED_SUPPORT_CHANNELS.split(',') : [];

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const isRepost = claim && claim.repost_url;
  const channelClaimId = claim && getChannelIdFromClaim(claim);

  const disableSupport =
    makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SUPPORT_TAG)(state) ||
    (channelClaimId && DISABLED_SUPPORT.includes(channelClaimId));

  return {
    disableSupport,
    isRepost,
    preferredCurrency: selectPreferredCurrency(state),
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doTipAccountCheckForUri,
};

export default connect(select, perform)(ClaimSupportButton);
