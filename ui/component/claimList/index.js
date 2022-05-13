import { connect } from 'react-redux';
import ClaimList from './view';
import * as SETTINGS from 'constants/settings';

import { selectClientSetting } from 'redux/selectors/settings';
import { selectOdyseeMembershipIsPremiumPlus } from 'redux/selectors/user';
import { selectAdBlockerFound } from 'redux/selectors/app';

const select = (state) => ({
  searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  hasPremiumPlus: selectOdyseeMembershipIsPremiumPlus(state),
  adBlockerFound: selectAdBlockerFound(state),
});

export default connect(select)(ClaimList);
