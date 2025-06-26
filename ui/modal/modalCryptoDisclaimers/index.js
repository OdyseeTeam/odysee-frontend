import ModalCryptoDisclaimers from './view';
import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doArConnect } from 'redux/actions/arwallet';
import { selectClientSettings } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';

const select = (state) => ({
  clientSettings: selectClientSettings(state),
});

const perform = {
  doHideModal,
  doArConnect,
  doSetClientSetting,
};

export default connect(select, perform)(ModalCryptoDisclaimers);
