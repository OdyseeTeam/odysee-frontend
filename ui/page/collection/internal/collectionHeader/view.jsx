// @flow
import React from 'react';
import Card from 'component/common/card';
import CollectionActions from '../collectionActions';
import Button from 'component/button';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as ICONS from 'constants/icons';
import Spinner from 'component/spinner';
import CollectionTitle from './internal/collectionTitle';
import CollectionSubtitle from './internal/collectionSubtitle';
import './style.scss';

type Props = {
  collectionId: string,
  showEdit: boolean,
  unavailableUris: Array<string>,
  setShowEdit: (show: boolean) => void,
  setUnavailable: (uris: Array<string>) => void,
  // -- redux --
  uri: string,
  collection: Collection,
  claimIsPending: boolean,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
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
    collection,
    claimIsPending,
    doCollectionEdit,
  } = props;

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
                'url(https://thumbnails.odycdn.com/optimize/s:390:0/quality:85/plain/https://thumbs.odycdn.com/50eb71f6fc6cecfd72aad564d4484cbc.webp)',
            }}
          />
          <CollectionActions
            uri={uri}
            collectionId={collectionId}
            isBuiltin={isBuiltin}
            setShowEdit={setShowEdit}
            showEdit={showEdit}
          />
        </div>
      </div>

      {/*
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
    */}
    </>
  );
};

export default CollectionHeader;
