import { connect } from 'react-redux';
import HomepageSort from './view';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { selectUserHasValidOdyseeMembership } from 'redux/selectors/memberships';

const select = (state) => ({
  homepageData: selectHomepageData(state) || {},
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  userHasOdyseeMembership: selectUserHasValidOdyseeMembership(state),
});

export default connect(select)(HomepageSort);
