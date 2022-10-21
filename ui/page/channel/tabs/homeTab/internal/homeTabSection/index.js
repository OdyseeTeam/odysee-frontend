import { connect } from 'react-redux';
import { doClaimSearch, doResolveClaimIds, doResolveUris } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { selectClaimSearchByQuery, selectFetchingClaimSearchByQuery } from 'redux/selectors/claims';
import { selectUrlsForCollectionId, selectNameForCollectionId } from 'redux/selectors/collections';

import HomeTabSection from './view';

const select = (state, props) => {

  let options: ClaimSearchOptions = {
    page_size: 6,
    page: 1,
    channel_ids: [props.channelClaimId],
    stream_types: props.section.fileType ? [props.section.fileType] : undefined,
    claim_type: props.section.type === 'playlists' ? 'collection' : undefined,    
    // not_tags: CsOptions.not_tags(notTags, showNsfw, hideMembersOnly),
    order_by: props.section.order_by,
    no_totals: true,
  };

  // console.log('options: ', options)
  const searchKey = createNormalizedClaimSearchKey(options);
  return {
    fetchingClaimSearch: selectFetchingClaimSearchByQuery(state)[searchKey],  
    claimSearchResults: !props.section.claimId ? selectClaimSearchByQuery(state)[searchKey] : undefined,    
    optionsStringified: JSON.stringify(options),
    collectionUrls: props.section.claimId ? selectUrlsForCollectionId(state, props.section.claimId) : undefined,
    collectionName: selectNameForCollectionId(state, props.section.claimId),
  };
};

const perform = {
  doClaimSearch,
};

export default connect(select, perform)(HomeTabSection);
