// @flow
import React from 'react';
import classnames from 'classnames';

import './style.scss';
import Button from 'component/button';
import Section from 'component/channelSections/Section';
import Spinner from 'component/spinner';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { SECTION_TAGS } from 'constants/collections';
import { createNormalizedClaimSearchKey } from 'util/claim';

const CLAIM_ID_LENGTH = 40;

type Props = {
  uri: string,
  editMode?: boolean,
  // --- redux ---
  claimId: ?string,
  featuredChannelsByChannelId: any,
  claimSearchByQuery: { [string]: Array<string> },
  myUnpublishedCollections: CollectionGroup,
  myEditedCollections: CollectionGroup,
  isPublishing: boolean,
  isFetchingMyCollections: boolean,
  doClaimSearch: ({}, {}) => Promise<any>,
  doFetchItemsInCollections: (params: { collectionIds: ClaimIds }) => Promise<any>,
  doPublishFeaturedChannels: (channelId: ChannelId) => Promise<any>,
  doOpenModal: (id: string, props: {}) => void,
};

export default function SectionList(props: Props) {
  const {
    editMode,
    claimId,
    featuredChannelsByChannelId,
    claimSearchByQuery,
    myUnpublishedCollections,
    myEditedCollections,
    isPublishing,
    isFetchingMyCollections,
    doClaimSearch,
    doFetchItemsInCollections,
    doPublishFeaturedChannels,
    doOpenModal,
  } = props;

  const [isClaimSearching, setIsClaimSearching] = React.useState(false);

  const options = {
    page_size: 24,
    page: 1,
    claim_type: ['collection'],
    channel_ids: [claimId],
    tags: [SECTION_TAGS.FEATURED_CHANNELS],
    no_totals: true,
  };

  const searchKey = createNormalizedClaimSearchKey(options);
  const claimSearchResult = claimSearchByQuery[searchKey]; // undefined = not fetched

  const sectionIds = React.useMemo(() => {
    const featuredChannels = featuredChannelsByChannelId[claimId] || [];
    return featuredChannels.map((fc) => fc.id);
  }, [featuredChannelsByChannelId, claimId]);

  const hasPendingChanges = React.useMemo(() => {
    // TODO: Memoization is poor because 'featuredChannelsByChannelId' is dependent on the volatile selectClaimsById.
    // Worth moving to redux now, or wait until Sections use is widespread?
    const unpublishedIds = Object.keys(myUnpublishedCollections);
    const editedIds = Object.keys(myEditedCollections);
    return (
      editMode &&
      (unpublishedIds.some((id) => sectionIds.includes(id)) || editedIds.some((id) => sectionIds.includes(id)))
    );
  }, [editMode, myUnpublishedCollections, myEditedCollections, sectionIds]);

  function handlePublishChanges() {
    if (claimId) {
      doPublishFeaturedChannels(claimId);
    }
  }

  React.useEffect(() => {
    if (!claimSearchResult) {
      setIsClaimSearching(true);
      doClaimSearch(options, { useAutoPagination: true })
        .then((res: { stream: Claim }) => {
          const collectionIds = [];
          Object.values(res).forEach((v) => {
            // $FlowIgnore mixed
            const id = v?.stream?.claim_id;
            if (id && id.length === CLAIM_ID_LENGTH) {
              collectionIds.push(id);
            }
          });
          doFetchItemsInCollections({ collectionIds }).finally(() => setIsClaimSearching(false));
        })
        .catch(() => setIsClaimSearching(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  return (
    <div
      className={classnames('channel_sections', {
        'channel_sections--disabled': isPublishing || isFetchingMyCollections,
      })}
    >
      {editMode && (
        <div className="channel_sections__actions">
          <Button
            label={__('Add featured channels')}
            button="secondary"
            icon={ICONS.ADD}
            onClick={() => doOpenModal(MODALS.FEATURED_CHANNELS_EDIT, { create: { ownerChannelId: claimId } })}
          />
          <Button
            label={isPublishing ? <Spinner type="small" /> : __('Publish changes')}
            button="primary"
            disabled={!hasPendingChanges || !claimId}
            onClick={handlePublishChanges}
          />
        </div>
      )}
      <div className="channel_sections__list">
        {sectionIds.length === 0 ? (
          <div className="empty main--empty">
            {isClaimSearching && <Spinner />}
            {!isClaimSearching && !isPublishing && !isFetchingMyCollections && __('No featured channels.')}
          </div>
        ) : (
          sectionIds.map((colId) => <Section key={colId} collectionId={colId} showAllItems={sectionIds.length === 1} />)
        )}
      </div>
    </div>
  );
}
