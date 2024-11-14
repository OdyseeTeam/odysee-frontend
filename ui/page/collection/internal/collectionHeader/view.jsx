// @flow
import React from 'react';
import Card from 'component/common/card';
import CollectionActions from '../collectionActions';
import CollectionHeaderActions from './internal/collectionHeaderActions';

import CollectionItemCount from 'page/playlists/internal/collectionsListMine/internal/collectionPreview/internal/collectionItemCount';
import CollectionPublicIcon from 'page/playlists/internal/collectionsListMine/internal/collectionPreview/internal/collection-public-icon';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import MarkdownPreview from 'component/common/markdown-preview';

import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

import DateTime from 'component/dateTime';
import ClaimAuthor from 'component/claimAuthor';
import CollectionTitle from './internal/collectionTitle';
import CollectionSubtitle from './internal/collectionSubtitle';

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
    // unavailableUris,
    setShowEdit,
    // setUnavailable,
    // collectionThumbnail,
    // -- redux --
    uri,
    claimIsPending,
    // doCollectionEdit,
  } = props;

  const isNotADefaultList = collection.id !== 'watchlater' && collection.id !== 'favorites';

  const backgroundImage =
    collection && collection.thumbnail && collection.thumbnail.url
      ? 'https://thumbnails.odycdn.com/optimize/s:390:220/quality:85/plain/' + collection.thumbnail.url
      : undefined;

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
        <div className="background__wrapper">
          {collection?.thumbnail?.url && (
            <div
              className="background"
              style={
                backgroundImage && {
                  backgroundImage: 'url(' + backgroundImage + ')',
                }
              }
            />
          )}
        </div>

        <div className="collection-header__content">
          <div className="collection-header__content-top">
            <div className="collection-header__title">
              {collection.title || collection.name}
              {uri ? <ClaimAuthor uri={uri} /> : <h1>{collection.name}</h1>}
            </div>
            <div className="collection-header__actions">
              <CollectionHeaderActions
                uri={uri}
                collectionId={collectionId}
                isBuiltin={isBuiltin}
                setShowEdit={setShowEdit}
                showEdit={showEdit}
                claimIsPending={claimIsPending}
                isHeader
              />
            </div>
          </div>
          <div className="collection-header__text">
            <div className="collection-header__description">
              <MarkdownPreview content={collection.description} />
              <div className="collection-header__meta">
                <div
                  className="collection-header__meta-entry"
                  style={
                    backgroundImage && {
                      backgroundImage: 'url(' + backgroundImage + ')',
                    }
                  }
                >
                  <CollectionItemCount collectionId={collectionId} />
                </div>
                {hasClaim ? (
                  <div
                    className="collection-header__meta-entry"
                    style={
                      backgroundImage && {
                        backgroundImage: 'url(' + backgroundImage + ')',
                      }
                    }
                  >
                    <CollectionPublicIcon />
                  </div>
                ) : (
                  <div
                    className="collection-header__meta-entry"
                    style={
                      backgroundImage && {
                        backgroundImage: 'url(' + backgroundImage + ')',
                      }
                    }
                  >
                    <CollectionPrivateIcon />
                  </div>
                )}
                {isNotADefaultList && (
                  <div
                    className="collection-header__meta-entry"
                    style={
                      backgroundImage && {
                        backgroundImage: 'url(' + backgroundImage + ')',
                      }
                    }
                  >
                    <div className="create-at">
                      {collection && (
                        <>
                          <Icon icon={ICONS.TIME} />
                          <DateTime timeAgo date={Number(collection?.createdAt) * 1000} />
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div
                  className="collection-header__meta-entry"
                  style={
                    backgroundImage && {
                      backgroundImage: 'url(' + backgroundImage + ')',
                    }
                  }
                >
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
