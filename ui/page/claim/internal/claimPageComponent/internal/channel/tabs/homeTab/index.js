import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimSearchByQuery,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectActiveLivestreamForChannel, selectActiveLivestreamInitialized } from 'redux/selectors/livestream';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { PREFERENCE_EMBED } from 'constants/tags';
import HomeTab from './view';

const select = (state, props) => {
  const claim = props.uri && selectClaimForUri(state, props.uri);
  return {
    claimSearchByQuery: selectClaimSearchByQuery(state),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, claim.claim_id),
    activeLivestreamInitialized: selectActiveLivestreamInitialized(state),
    settingsByChannelId: selectSettingsByChannelId(state),
    preferEmbed: makeSelectTagInClaimOrChannelForUri(props.uri, PREFERENCE_EMBED)(state),
    claim,
  };
};

const perform = {
  doResolveUris,
  doFetchChannelIsLiveForId,
  doUpdateCreatorSettings,
};

export default connect(select, perform)(HomeTab);
