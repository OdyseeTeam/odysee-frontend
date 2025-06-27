import { connect } from 'react-redux';
import HomepageSort from './view';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { hasLegacyOdyseePremium } from '../../redux/selectors/user';

const select = (state) => ({
  homepageData: selectHomepageData(state) || {},
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  userHasOdyseeMembership: hasLegacyOdyseePremium(state),
});

export default connect(select)(HomepageSort);
