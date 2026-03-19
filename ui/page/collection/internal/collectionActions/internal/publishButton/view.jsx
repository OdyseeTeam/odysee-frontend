// @flow
import * as ICONS from 'constants/icons';
import { useHistory } from 'react-router';
import { COLLECTION_PAGE as CP } from 'constants/urlParams';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';

type Props = {
  showEdit?: boolean,
  // redux
  collectionHasEdits: boolean,
  claimIsPending: boolean,
  collectionLength: number,
  autoPublish: boolean,
  isPublishing: boolean,
  publishError?: ?string,
};

function CollectionPublishButton(props: Props) {
  const { showEdit, collectionHasEdits, claimIsPending, collectionLength, autoPublish, isPublishing, publishError } =
    props;

  const { push } = useHistory();

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
      onClick={() => push(`?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)}
      icon={ICONS.PUBLISH}
      iconSize={18}
      disabled={claimIsPending || showEdit || isPublishing}
    />
  );
}

export default CollectionPublishButton;
