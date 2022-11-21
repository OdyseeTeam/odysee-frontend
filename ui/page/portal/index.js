import { connect } from 'react-redux';
import { selectHomepageData } from 'redux/selectors/settings';
import PortalPage from './view';

const select = (state) => {
  const homepageData = selectHomepageData(state);
  const { portals } = homepageData;
  const { mainPortal } = portals || {};

  return {
    homepageData,
    portals: mainPortal?.portals,
  };
};

const perform = (dispatch) => ({
  // setHomepage: value => dispatch(doSetHomepage(value)),
});

export default connect(select, perform)(PortalPage);
