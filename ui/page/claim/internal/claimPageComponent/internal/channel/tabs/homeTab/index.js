import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimSearchByQuery,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { PREFERENCE_EMBED } from 'constants/tags';
import HomeTab from './view';

const select = (state, props) => {
  const claim = props.uri && selectClaimForUri(state, props.uri);
  return {
    claimSearchByQuery: selectClaimSearchByQuery(state),
    settingsByChannelId: selectSettingsByChannelId(state),
    preferEmbed: makeSelectTagInClaimOrChannelForUri(props.uri, PREFERENCE_EMBED)(state),
    claim,
  };
};

const perform = {
  doResolveUris,
  doUpdateCreatorSettings,
};

export default connect(select, perform)(HomeTab);
