import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import { doSetAdBlockerFound } from 'redux/actions/app';
import AdTileA from './view';

const select = (state, props) => ({
  shouldShowAds: selectShouldShowAds(state),
});

const perform = {
  doSetAdBlockerFound,
};

export default connect(select, perform)(AdTileA);
