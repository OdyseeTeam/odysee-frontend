import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import FeaturedBanner from './view';

const select = (state) => ({
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
});

const perform = {
  doSetClientSetting,
};

export default connect(select, perform)(FeaturedBanner);
