import { connect } from 'react-redux';

import { PREFERENCE_EMBED } from 'constants/tags';

import {
  makeSelectTagInClaimOrChannelForUri,
  selectTitleForUri,
  selectIsStreamPlaceholderForUri,
} from 'redux/selectors/claims';
import { selectContentPositionForUri, selectContentStates } from 'redux/selectors/content';

import fileViewerEmbeddedTitle from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    title: selectTitleForUri(state, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    contentPosition: selectContentPositionForUri(state, uri),
    uriAccessKey: props.uriAccessKey || selectContentStates(state).uriAccessKeys[uri],
    preferEmbed: makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state),
  };
};

export default connect(select)(fileViewerEmbeddedTitle);
