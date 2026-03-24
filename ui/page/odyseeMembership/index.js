import { connect } from 'react-redux';

import OdyseeMembership from './view';
import { hasLegacyOdyseePremium } from 'redux/selectors/user';

const select = (state) => ({
  hasOdyseeLegacy: hasLegacyOdyseePremium(state),
});

export default connect(select)(OdyseeMembership);
