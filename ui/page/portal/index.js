import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import PortalPage from './view';

const select = (state) => {
  const homepageData = selectHomepageData(state);
  const { portals } = homepageData;
  const { mainPortal } = portals || {};

  return {
    portals: mainPortal?.portals,
    activeTheme: selectClientSetting(state, SETTINGS.THEME),
  };
};

const perform = (dispatch) => ({
  // setHomepage: value => dispatch(doSetHomepage(value)),
});

export default connect(select, perform)(PortalPage);
