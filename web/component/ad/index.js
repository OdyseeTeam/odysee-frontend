import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import { selectHomepageCategoryChannelIds } from 'redux/selectors/settings';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import Ad from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const shouldShowAds = selectShouldShowAds(state);
  return {
    shouldShowAds,
    channelIdWhitelist: shouldShowAds ? selectHomepageCategoryChannelIds(state) : [],
    channelId: getChannelIdFromClaim(claim),
  };
};

export default connect(select)(Ad);
