import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import { selectHomepageData } from 'redux/selectors/settings';
import { selectClaimForUri } from 'redux/selectors/claims';
import Ad from './view';

const select = (state, props) => {
  return {
    shouldShowAds: selectShouldShowAds(state),
    homepageData: selectHomepageData(state),
    claim: selectClaimForUri(state, props.uri),
  };
};

export default connect(select)(Ad);
