import { connect } from 'react-redux'
import WalletFiatAccountHistory from './view';
import { selectLanguage } from 'redux/selectors/settings';

const select = (state) => ({
  appLanguage: selectLanguage(state),
});


export default connect(select)(WalletFiatAccountHistory);
