import { connect } from 'react-redux';

import { selectClaimForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectShowScheduledLiveInfoForUri } from 'redux/selectors/livestream';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
import { doFileGetForUri } from 'redux/actions/file';
import { doFetchItemsInCollection } from 'redux/actions/collections';

import withResolvedClaimRender from 'hocs/withResolvedClaimRender';

import EmbedClaimComponent from './view';

const select = (state, props) => {
  const { uri, collectionId } = props;
  const claim = selectClaimForUri(state, uri);

  // Resolve channel from claim robustly: channel pages use their own ID, streams use signing_channel
  const channelClaimId = getChannelIdFromClaim(claim);
  const isCollection = claim?.value_type === 'collection';

  return {
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    showScheduledInfo: selectShowScheduledLiveInfoForUri(state, uri),
    streamingUrl: selectStreamingUrlForUri(state, uri),
    collectionUrls: collectionId ? selectUrlsForCollectionId(state, collectionId) : null,
    channelClaimId,
    isCollection,
  };
};

const perform = {
  doFileGetForUri,
  doFetchItemsInCollection,
};

export default withResolvedClaimRender(connect(select, perform)(EmbedClaimComponent));
