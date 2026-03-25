import type { Props } from './view';
import AdTileA from './view';
import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';

const select = (state: any, props: any) => ({
  shouldShowAds: selectShouldShowAds(state),
});

const perform = {};
export default connect(select, perform)(AdTileA as any);
