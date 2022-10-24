import { connect } from 'react-redux';
import { doClaimSearch } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { selectClaimSearchByQuery, selectFetchingClaimSearchByQuery } from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectNameForCollectionId,
  selectMyPublishedCollections,
} from 'redux/selectors/collections';

import HomeTabSection from './view';

const select = (state, props) => {
  let options: ClaimSearchOptions = {
    page_size: props.section.type !== 'featured' ? 12 : 1,
    page: 1,
    channel_ids: [props.channelClaimId],
    stream_types: props.section.file_type ? [props.section.file_type] : undefined,
    claim_type: props.section.type === 'playlists' ? 'collection' : 'stream',
    order_by: props.section.order_by,
    no_totals: true,
  };

  const searchKey = createNormalizedClaimSearchKey(options);
  const publishedCollections = selectMyPublishedCollections(state);

  return {
    fetchingClaimSearch: selectFetchingClaimSearchByQuery(state)[searchKey],
    claimSearchResults: !props.section.claimId ? selectClaimSearchByQuery(state)[searchKey] : undefined,
    optionsStringified: JSON.stringify(options),
    collectionUrls: props.section.claimId ? selectUrlsForCollectionId(state, props.section.claimId) : undefined,
    collectionName: selectNameForCollectionId(state, props.section.claimId),
    publishedCollections,
  };
};

const perform = {
  doClaimSearch,
};

export default connect(select, perform)(HomeTabSection);
