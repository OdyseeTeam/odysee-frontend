// @flow
import React from 'react';
import Card from 'component/common/card';
import CollectionActions from '../collectionActions';
import CollectionHeaderActions from './internal/collectionHeaderActions';
CollectionHeaderActions;
import Button from 'component/button';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as ICONS from 'constants/icons';
import Spinner from 'component/spinner';
import CollectionTitle from './internal/collectionTitle';
import CollectionSubtitle from './internal/collectionSubtitle';
import './style.scss';

type Props = {
  collection: any,
  showEdit: boolean,
  // unavailableUris: Array<string>,
  setShowEdit: (show: boolean) => void,
  // setUnavailable: (uris: Array<string>) => void,
  collectionThumbnail: string,
  // -- redux --
  uri: string,
  collection: Collection,
  claimIsPending: boolean,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
};

const CollectionHeader = (props: Props) => {
  const {
    collection,
    showEdit,
    unavailableUris,
    setShowEdit,
    setUnavailable,
    collectionThumbnail,
    // -- redux --
    uri,
    claimIsPending,
    doCollectionEdit,
  } = props;

  console.log('CollectionHeader props: ', props);
  const { id: collectionId } = collection;

  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(collectionId);

  if (collection?.type === COL_TYPES.FEATURED_CHANNELS) {
    return (
      <Card
        title={<CollectionTitle collectionId={collectionId} noIcon />}
        subtitle={<CollectionSubtitle collectionId={collectionId} />}
      />
    );
  }

  return (
    <>
      <div className="collection-header__wrapper">
        <CollectionTitle collectionId={collectionId} />
        <div className="background__wrapper">
          <div
            className="background"
            style={{
              backgroundImage:
                'url(https://thumbnails.odycdn.com/optimize/s:390:220/quality:85/plain/' +
                collection.thumbnail.url +
                ')',
            }}
          />

          <div className="collection-header__content">
            <div className="collection-header__actions">
              <CollectionHeaderActions
                uri={uri}
                collectionId={collectionId}
                isBuiltin={isBuiltin}
                setShowEdit={setShowEdit}
                showEdit={showEdit}
                isHeader
              />
            </div>
            <div className="collection-header__meta">
              <div className="collection-header__description">{collection.description}</div>
            </div>
          </div>
        </div>
        <CollectionActions
          uri={uri}
          collectionId={collectionId}
          isBuiltin={isBuiltin}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
        />
      </div>

      <Card
        title={<CollectionTitle collectionId={collectionId} />}
        titleActions={
          unavailableUris.length > 0 ? (
            <Button
              button="secondary"
              icon={ICONS.DELETE}
              label={__('Remove all unavailable items')}
              onClick={() => {
                doCollectionEdit(collectionId, { uris: unavailableUris, remove: true });
                setUnavailable([]);
              }}
            />
          ) : (
            claimIsPending && (
              <div className="help card__title--help">
                <Spinner type="small" />
                {__('Your publish is being confirmed and will be live soon')}
              </div>
            )
          )
        }
        subtitle={<CollectionSubtitle collectionId={collectionId} />}
        body={
          <CollectionActions
            uri={uri}
            collectionId={collectionId}
            isBuiltin={isBuiltin}
            setShowEdit={setShowEdit}
            showEdit={showEdit}
          />
        }
      />
    </>
  );
};

export default CollectionHeader;
