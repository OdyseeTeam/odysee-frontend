import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { getClaimMetadata } from 'util/claim';
import * as SETTINGS from 'constants/settings';
import ChaptersCard from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const metadata = getClaimMetadata(claim);

  return {
    description: metadata && metadata.description,
    visible: selectClientSetting(state, SETTINGS.CHAPTERS_CARD_VISIBLE) || false,
  };
};

const perform = {
  setVisible: (val) => doSetClientSetting(SETTINGS.CHAPTERS_CARD_VISIBLE, val),
};

export default connect(select, perform)(ChaptersCard);
