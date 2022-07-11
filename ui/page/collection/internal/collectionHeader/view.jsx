// @flow
import React from 'react';
import Card from 'component/common/card';
import CollectionActions from '../collectionActions';
import FileDescription from 'component/fileDescription';
import Icon from 'component/common/icon';
import Button from 'component/button';
import ClaimAuthor from 'component/claimAuthor';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Spinner from 'component/spinner';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import Tooltip from 'component/common/tooltip';

type Props = {
  collectionId: string,
  showEdit: boolean,
  unavailableUris: Array<string>,
  setShowEdit: (show: boolean) => void,
  setUnavailable: (uris: Array<string>) => void,
  // -- redux --
  uri: string,
  claim: Claim,
  collection: Collection,
  collectionCount: number,
  claimIsPending: boolean,
  collectionHasEdits: boolean,
  publishedCollectionCount: ?number,
  doCollectionDelete: (id: string, colKey: ?string) => void,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
  doOpenModal: (id: string, params: {}) => void,
};

const CollectionHeader = (props: Props) => {
  const {
    collectionId,
    showEdit,
    unavailableUris,
    setShowEdit,
    setUnavailable,
    // -- redux --
    uri,
    claim,
    collection,
    collectionCount,
    claimIsPending,
    collectionHasEdits,
    publishedCollectionCount,
    doCollectionDelete,
    doCollectionEdit,
    doOpenModal,
  } = props;

  const [showInfo, setShowInfo] = React.useState(false);

  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(collectionId);
  const listName = claim ? claim.value.title || claim.name : collection && collection.name;

  return (
    <Card
      title={
        <span>
          <Icon
            icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[collectionId] || ICONS.PLAYLIST}
            className="icon--margin-right"
          />
          {isBuiltin ? __(listName) : listName}
          {collectionHasEdits ? __(' (Published playlist with pending changes)') : undefined}
        </span>
      }
      titleActions={
        unavailableUris.length > 0 ? (
          <Button
            button="close"
            icon={ICONS.DELETE}
            label={__('Remove all unavailable claims')}
            onClick={() => {
              doCollectionEdit(collectionId, { uris: unavailableUris, remove: true });
              setUnavailable([]);
            }}
          />
        ) : collectionHasEdits ? (
          <Tooltip title={__('Delete all edits from this published playlist')}>
            <Button
              button="close"
              icon={ICONS.REFRESH}
              label={__('Clear Updates')}
              onClick={() =>
                doOpenModal(MODALS.CONFIRM, {
                  title: __('Clear Updates'),
                  subtitle: __(
                    "Are you sure you want to delete all edits from this published playlist? (You won't be able to undo this action later)"
                  ),
                  onConfirm: (closeModal) => {
                    doCollectionDelete(collectionId, COLLECTIONS_CONSTS.COL_KEY_EDITED);
                    closeModal();
                  },
                })
              }
            />
          </Tooltip>
        ) : claimIsPending ? (
          <div className="help card__title--help">
            <Spinner type="small" />
            {__('Your publish is being confirmed and will be live soon')}
          </div>
        ) : undefined
      }
      subtitle={
        <div>
          <span className="collection__subtitle">
            {collectionHasEdits
              ? __('Published count: %published_count%, edited count: %edited_count%', {
                  published_count: publishedCollectionCount,
                  edited_count: collectionCount,
                })
              : collectionCount === 1
              ? __('1 item')
              : __('%collectionCount% items', { collectionCount })}
          </span>

          {uri ? <ClaimAuthor uri={uri} /> : <CollectionPrivateIcon />}
        </div>
      }
      body={
        <CollectionActions
          uri={uri}
          collectionId={collectionId}
          setShowInfo={setShowInfo}
          showInfo={showInfo}
          isBuiltin={isBuiltin}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
        />
      }
      actions={
        showInfo && uri ? (
          <div className="section">
            <FileDescription uri={uri} expandOverride />
          </div>
        ) : undefined
      }
    />
  );
};

export default CollectionHeader;
