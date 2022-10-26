import { connect } from 'react-redux';
import { doClaimSearch } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import {
  selectClaimSearchByQuery,
  selectFetchingClaimSearchByQuery,
  selectClaimUriForId,
} from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectNameForCollectionId,
  selectMyPublishedCollections,
} from 'redux/selectors/collections';

import HomeTabSection from './view';

const select = (state, props) => {
  // const options: ClaimSearchOptions = {
  const options = {
    page_size: props.section.type !== 'featured' ? 12 : 1,
    page: 1,
    channel_ids: [props.channelClaimId],
    stream_types: props.section.file_type ? [props.section.file_type] : undefined,
    claim_type: props.section.type === 'playlists' ? 'collection' : 'stream',
    order_by: props.section.type !== 'featured' ? props.section.order_by : ['effective_amount'],
    no_totals: true,
  };

  const searchKey = createNormalizedClaimSearchKey(options);
  const publishedCollections = selectMyPublishedCollections(state);
  const singleClaimUri = props.section.claim_id ? selectClaimUriForId(state, props.section.claim_id) : undefined;

  return {
    fetchingClaimSearch: selectFetchingClaimSearchByQuery(state)[searchKey],
    claimSearchResults: !props.section.claim_id ? selectClaimSearchByQuery(state)[searchKey] : undefined,
    optionsStringified: JSON.stringify(options),
    collectionUrls: props.section.claim_id ? selectUrlsForCollectionId(state, props.section.claim_id) : undefined,
    collectionName: selectNameForCollectionId(state, props.section.claim_id),
    publishedCollections,
    singleClaimUri,
  };
};

const perform = {
  doClaimSearch,
  // doResolveUris: (uris, returnCachedUris) => dispatch(doResolveUris(uris, returnCachedUris)),
};

export default connect(select, perform)(HomeTabSection);
