import { connect } from 'react-redux';
import { doSetHomepage } from 'redux/actions/settings';
import { selectHomepageCode } from 'redux/selectors/settings';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import Portal from './view';

const select = (state) => {
  const homepageData = selectHomepageData(state);
  const { portals } = homepageData;
  const { mainPortal } = portals || {};

  return {
    portals: mainPortal?.portals,
  };
  // homepage: selectHomepageCode(state),
};

const perform = (dispatch) => ({
  // setHomepage: value => dispatch(doSetHomepage(value)),
});

export default connect(select, perform)(Portal);
