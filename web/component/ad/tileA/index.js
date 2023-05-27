// @flow
import type { Props } from './view';
import AdTileA from './view';
import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import { doSetAdBlockerFound } from 'redux/actions/app';

const select = (state, props) => ({
  shouldShowAds: selectShouldShowAds(state),
});

const perform = {
  doSetAdBlockerFound,
};

export default connect<_, Props, _, _, _, _>(select, perform)(AdTileA);
