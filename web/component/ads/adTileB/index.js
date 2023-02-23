import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
// import { makeSelectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { doSetAdBlockerFound } from 'redux/actions/app';
import AdTileB from './view';

const select = (state, props) => ({
  shouldShowAds: selectShouldShowAds(state),
});

const perform = {
  doSetAdBlockerFound,
};

export default connect(select, perform)(AdTileB);
