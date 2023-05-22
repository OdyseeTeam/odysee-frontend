import { connect } from 'react-redux';
import { doClaimSearch, doResolveClaimId, doResolveUris } from 'redux/actions/claims';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
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
import { CsOptHelper } from 'util/claim-search';
import HomeTabSection from './view';

const select = (state, props) => {
  const hasPremiumPlus = selectUserHasOdyseePremiumPlus(state);
  const stream_types =
    props.section.file_type && Array.isArray(props.section.file_type)
      ? props.section.file_type
      : props.section.file_type
      ? [props.section.file_type]
      : undefined;
  const claimType =
    props.section.type === 'playlists' ? 'collection' : props.section.type === 'reposts' ? 'repost' : 'stream';
  const options = {
    page_size: props.section.type !== 'featured' ? (hasPremiumPlus ? 12 : 11) : 1,
    page: 1,
    channel_ids: [props.channelClaimId],
    stream_types: props.section.type !== 'reposts' ? stream_types : undefined,
    claim_type: claimType,
    order_by: props.section.order_by || ['effective_amount'],
    not_tags:
      props.section.type === 'playlists'
        ? CsOptHelper.not_tags({ notTags: [SECTION_TAGS.FEATURED_CHANNELS] })
        : CsOptHelper.not_tags(),
    any_tags: props.section.type === 'channels' ? [SECTION_TAGS.FEATURED_CHANNELS] : undefined,
    no_totals: true,
    index: props.index,
    has_source: true,
  };
  const searchKey = createNormalizedClaimSearchKey(options);

  const requiresSearch =
    props.section.type === 'content' ||
    props.section.type === 'playlists' ||
    props.section.type === 'reposts' ||
    (props.section.type === 'featured' && !props.section.claim_id);
  const fetchingClaimSearch = requiresSearch ? selectFetchingClaimSearchByQuery(state)[searchKey] : undefined;
  const claimSearchResults =
    requiresSearch && !props.section.claim_id ? selectClaimSearchByQuery(state)[searchKey] : undefined;

  const activeLivestream = selectActiveLivestreamForChannel(state, props.channelClaimId);

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
    activeLivestreamUri: activeLivestream?.uri,
    hasPremiumPlus,
  };
};

const perform = {
  doClaimSearch,
  doResolveClaimId,
  doResolveUris,
};

export default connect(select, perform)(HomeTabSection);
