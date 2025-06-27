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
};

function CollectionPublishButton(props: Props) {
  const { showEdit, collectionHasEdits, claimIsPending, collectionLength } = props;

  const { push } = useHistory();

  if (collectionLength === 0) return null;

  return (
    <FileActionButton
      title={collectionHasEdits ? __('Publish Updates') : __('Publish')}
      label={collectionHasEdits ? __('Publish Updates') : __('Publish')}
      className={collectionHasEdits ? 'button--warning' : ''}
      onClick={() => push(`?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)}
      icon={ICONS.PUBLISH}
      iconSize={18}
      disabled={claimIsPending || showEdit}
    />
  );
}

export default CollectionPublishButton;
