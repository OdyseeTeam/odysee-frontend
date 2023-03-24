// @flow
import React from 'react';
import Card from 'component/common/card';
import CollectionActions from '../collectionActions';
import CollectionHeaderActions from './internal/collectionHeaderActions';
CollectionHeaderActions;
import Button from 'component/button';

import CollectionItemCount from 'page/playlists/internal/collectionsListMine/internal/collectionPreview/internal/collectionItemCount';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import CollectionPublicIcon from 'page/playlists/internal/collectionsListMine/internal/collectionPreview/internal/collection-public-icon';

import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

import Spinner from 'component/spinner';
import DateTime from 'component/dateTime';
import CollectionTitle from './internal/collectionTitle';
import CollectionSubtitle from './internal/collectionSubtitle';
import ClaimAuthor from 'component/claimAuthor';

import './style.scss';

type Props = {
  collection: any,
  showEdit: boolean,
  hasClaim: boolean,
  unavailableUris: Array<string>,
  setShowEdit: (show: boolean) => void,
  setUnavailable: (uris: Array<string>) => void,
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
    hasClaim,
    unavailableUris,
    setShowEdit,
    setUnavailable,
    collectionThumbnail,
    // -- redux --
    uri,
    claimIsPending,
    doCollectionEdit,
  } = props;

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
        {/*<CollectionTitle collectionId={collectionId} />*/}
        {collection?.thumbnail?.url && (
          <div className="background__wrapper">
            <div
              className="background"
              style={{
                backgroundImage:
                  'url(https://thumbnails.odycdn.com/optimize/s:390:220/quality:85/plain/' +
                  // $FlowIgnore
                  collection?.thumbnail?.url +
                  ')',
              }}
            />
          </div>
        )}

        <div className="collection-header__content">
          <div class="collection-header__content-top">
            <div className="collection-header__title">
              {collection.title}
              {uri ? <ClaimAuthor uri={uri} /> : <CollectionPrivateIcon />}
            </div>
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
          </div>
          <div className="collection-header__text">
            <div className="collection-header__description">
              {collection.description}
              <div className="collection-header__meta">
                <CollectionItemCount collectionId={collectionId} />
                {hasClaim ? <CollectionPublicIcon /> : <CollectionPrivateIcon />}
                <div className="create-at">
                  {collection && (
                    <>
                      <Icon icon={ICONS.TIME} />
                      <DateTime timeAgo date={Number(collection?.createdAt) * 1000} />
                    </>
                  )}
                </div>
                <div className="update-at">
                  {collection && (
                    <>
                      <Icon icon={ICONS.EDIT} />
                      <DateTime timeAgo date={Number(collection?.updatedAt) * 1000} />
                    </>
                  )}
                </div>
              </div>
            </div>
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

      {/* OLD CARD
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
