import * as ICONS from 'constants/icons';
import { useNavigate } from 'react-router-dom';
import { COLLECTION_PAGE as CP } from 'constants/urlParams';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useAppSelector } from 'redux/hooks';
import { selectClaimIsPendingForId } from 'redux/selectors/claims';
import {
  selectCollectionHasEditsForId,
  selectCollectionLengthForId,
  selectCollectionAutoPublishForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
} from 'redux/selectors/collections';
type Props = {
  collectionId: string;
  showEdit?: boolean;
};

function CollectionPublishButton(props: Props) {
  const { collectionId, showEdit } = props;
  const claimIsPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const collectionLength = useAppSelector((state) => selectCollectionLengthForId(state, collectionId));
  const autoPublish = useAppSelector((state) => selectCollectionAutoPublishForId(state, collectionId));
  const isPublishing = useAppSelector((state) => selectCollectionIsPublishingForId(state, collectionId));
  const publishError = useAppSelector((state) => selectCollectionPublishErrorForId(state, collectionId));
  const navigate = useNavigate();
  if (collectionLength === 0) return null;
  if (autoPublish && !collectionHasEdits && !isPublishing && !publishError) return null;
  const label = isPublishing
    ? __('Publishing...')
    : publishError && collectionHasEdits
      ? __('Retry Publish')
      : collectionHasEdits
        ? autoPublish
          ? __('Auto-publish On')
          : __('Publish Updates')
        : __('Publish');
  return (
    <FileActionButton
      title={label}
      label={label}
      className={collectionHasEdits ? 'button--warning' : ''}
      onClick={() => navigate(`?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)}
      icon={ICONS.PUBLISH}
      iconSize={18}
      disabled={claimIsPending || showEdit || isPublishing}
    />
  );
}

export default CollectionPublishButton;
