import { connect } from 'react-redux';
import { doClaimSearch, doResolveClaimId, doResolveUris } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import {
  selectClaimSearchByQuery,
  selectFetchingClaimSearchByQuery,
  selectClaimUriForId,
} from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectCollectionTitleForId,
  selectMyPublishedCollections,
  selectClaimIdsForCollectionId,
} from 'redux/selectors/collections';
import { SECTION_TAGS } from 'constants/collections';
import { selectUserHasOdyseePremiumPlus } from 'redux/selectors/memberships';
import { selectFeaturedChannelsForChannelId } from 'redux/selectors/comments';
import { CsOptions } from 'util/claim-search';
import HomeTabSection from './view';

const select = (state, props) => {
  const hasPremiumPlus = selectUserHasOdyseePremiumPlus(state);
  const stream_types =
    props.section.file_type && Array.isArray(props.section.file_type)
      ? props.section.file_type
      : props.section.file_type
      ? [props.section.file_type]
      : undefined;
  const options = {
    page_size: props.section.type !== 'featured' ? (hasPremiumPlus ? 12 : 11) : 1,
    page: 1,
    channel_ids: [props.channelClaimId],
    stream_types: stream_types,
    claim_type: props.section.type === 'playlists' ? 'collection' : 'stream',
    order_by: props.section.order_by || ['effective_amount'],
    not_tags:
      props.section.type === 'playlists'
        ? CsOptions.not_tags({ notTags: [SECTION_TAGS.FEATURED_CHANNELS] })
        : CsOptions.not_tags(),
    any_tags: props.section.type === 'channels' ? [SECTION_TAGS.FEATURED_CHANNELS] : undefined,
    no_totals: true,
    index: props.index,
    has_source: true,
  };
  const searchKey = createNormalizedClaimSearchKey(options);

  const requiresSearch =
    props.section.type === 'content' ||
    props.section.type === 'playlists' ||
    (props.section.type === 'featured' && !props.section.claim_id);
  const fetchingClaimSearch = requiresSearch ? selectFetchingClaimSearchByQuery(state)[searchKey] : undefined;
  const claimSearchResults =
    requiresSearch && !props.section.claim_id ? selectClaimSearchByQuery(state)[searchKey] : undefined;

  return {
    requiresSearch,
    fetchingClaimSearch,
    claimSearchResults,
    optionsStringified: JSON.stringify(options),
    collectionUrls:
      props.section.type === 'playlist' && props.section.claim_id
        ? selectUrlsForCollectionId(state, props.section.claim_id)
        : undefined,
    collectionClaimIds:
      props.section.type === 'playlist' && props.section.claim_id
        ? selectClaimIdsForCollectionId(state, props.section.claim_id)
        : undefined,
    collectionName:
      props.section.type === 'playlist' ? selectCollectionTitleForId(state, props.section.claim_id) : undefined,
    publishedCollections: selectMyPublishedCollections(state),
    singleClaimUri:
      props.section.type === 'featured' && props.section.claim_id && selectClaimUriForId(state, props.section.claim_id),
    featuredChannels: selectFeaturedChannelsForChannelId(state, props.channelClaimId),
    hasPremiumPlus,
  };
};

const perform = {
  doClaimSearch,
  doResolveClaimId,
  doResolveUris,
};

export default connect(select, perform)(HomeTabSection);
