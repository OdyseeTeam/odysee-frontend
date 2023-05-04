import { connect } from 'react-redux';
import SelectHomepage from './view';

import * as SETTINGS from 'constants/settings';
import { doSetHomepage } from 'redux/actions/settings';
import { selectClientSetting, selectHomepageKeys } from 'redux/selectors/settings';

const select = (state) => ({
  homepage: selectClientSetting(state, SETTINGS.HOMEPAGE),
  homepageKeys: selectHomepageKeys(state),
});

const perform = {
  setHomepage: doSetHomepage,
};

export default connect(select, perform)(SelectHomepage);
